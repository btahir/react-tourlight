'use client'

import type { ChangeEvent, ReactNode } from 'react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { SpotlightProvider } from '../components/spotlight-provider.tsx'
import { SpotlightTour } from '../components/spotlight-tour.tsx'
import { inspectTourTargets } from '../diagnostics.ts'
import type { TourDocument, TourDocumentStep, TourRegistry } from '../document.ts'
import {
  compileTourDocument,
  createTourDocument,
  formatTourDocument,
  MAX_TOUR_DOCUMENT_BYTES,
  parseTourDocument,
  validateTourDocument,
} from '../document.ts'
import { useSpotlight } from '../hooks/use-spotlight.ts'
import type { SpotlightProviderProps } from '../types.ts'
import { getStudioSelector } from './targets.ts'

export interface TourStudioProps {
  /** Controlled document. Pair with onChange. */
  value?: TourDocument
  /** Initial document for uncontrolled authoring. */
  defaultValue?: TourDocument
  onChange?: (document: TourDocument) => void
  /** Optional browser-only draft key. Omit to disable local persistence. */
  storageKey?: string
  registry?: TourRegistry
  /** The real application or a representative playground. Targets stay in this subtree. */
  children: ReactNode
  className?: string
  /** Router integration for previewing multi-page guides in an app-owned authoring shell. */
  navigate?: SpotlightProviderProps['navigate']
  isRouteActive?: SpotlightProviderProps['isRouteActive']
}

type Panel = 'edit' | 'source' | 'checks' | 'connect'
type Check = { id: string; title: string; status: string; message: string }
const emptyRegistry: TourRegistry = {}
const makeId = () => `step-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`
const prettyError = (error: unknown) => (error instanceof Error ? error.message : String(error))

export function TourStudio(props: TourStudioProps) {
  const [runtimeError, setRuntimeError] = useState('')
  return (
    <SpotlightProvider
      theme="light"
      transitionDuration={180}
      autoScroll
      navigate={props.navigate}
      isRouteActive={props.isRouteActive}
      onError={(error) => setRuntimeError(prettyError(error))}
    >
      <StudioWorkspace
        {...props}
        runtimeError={runtimeError}
        clearRuntimeError={() => setRuntimeError('')}
      />
    </SpotlightProvider>
  )
}

function StudioWorkspace({
  value,
  defaultValue,
  onChange,
  storageKey,
  registry = emptyRegistry,
  children,
  className = '',
  runtimeError,
  clearRuntimeError,
}: TourStudioProps & { runtimeError: string; clearRuntimeError: () => void }) {
  const [internal, setInternal] = useState<TourDocument>(
    () => defaultValue ?? createTourDocument({ id: 'welcome', name: 'Welcome to your product' }),
  )
  const isControlled = value !== undefined
  const doc = value ?? internal
  const [selectedId, setSelectedId] = useState(doc.steps[0]?.id ?? '')
  const [panel, setPanel] = useState<Panel>('edit')
  const [picking, setPicking] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [source, setSource] = useState('')
  const [sourceDirty, setSourceDirty] = useState(false)
  const [saveState, setSaveState] = useState<'local' | 'saving' | 'saved' | 'failed' | 'invalid'>(
    'local',
  )
  const [checks, setChecks] = useState<Check[]>([])
  const [history, setHistory] = useState<TourDocument[]>([])
  const [future, setFuture] = useState<TourDocument[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [recoveryBlocked, setRecoveryBlocked] = useState(false)
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const docRef = useRef(doc)
  docRef.current = doc
  const baseId = useId()
  const player = useSpotlight()
  const selected = doc.steps.find((step) => step.id === selectedId) ?? doc.steps[0]
  const selectedIndex = selected ? doc.steps.indexOf(selected) : -1
  const validation = useMemo(() => validateTourDocument(doc), [doc])
  const compiled = useMemo(() => {
    try {
      return {
        steps: compileTourDocument(doc, registry).map((step) => ({
          ...step,
          target: () => {
            try {
              return canvasRef.current?.querySelector<HTMLElement>(String(step.target)) ?? null
            } catch {
              return null
            }
          },
        })),
        error: '',
      }
    } catch (cause) {
      return { steps: [], error: prettyError(cause) }
    }
  }, [doc, registry])

  const assign = useCallback(
    (next: TourDocument) => {
      setInternal(next)
      onChange?.(next)
    },
    [onChange],
  )
  const commit = useCallback(
    (next: TourDocument, message?: string) => {
      setHistory((items) => [...items.slice(-49), docRef.current])
      setFuture([])
      setRecoveryBlocked(false)
      assign(next)
      setChecks([])
      setError('')
      if (message) setNotice(message)
    },
    [assign],
  )

  useEffect(() => {
    setRecoveryBlocked(false)
    if (storageKey && !isControlled) {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const recovered = parseTourDocument(stored)
          setInternal(recovered)
          setSelectedId(recovered.steps[0]?.id ?? '')
          setNotice('Restored your local draft.')
        }
      } catch {
        setRecoveryBlocked(true)
        setSaveState('failed')
        setError(
          'Your saved draft could not be restored and has been preserved. Editing or importing will replace it; export your browser storage value first if you need to recover it.',
        )
      }
    }
    setHydrated(true)
  }, [storageKey, isControlled])

  useEffect(() => {
    if (!hydrated || !storageKey || recoveryBlocked) return
    if (!validation.valid) {
      setSaveState('invalid')
      return
    }
    setSaveState('saving')
    const save = () => {
      try {
        localStorage.setItem(storageKey, formatTourDocument(doc))
        setSaveState('saved')
      } catch {
        setSaveState('failed')
        setError('Browser storage is unavailable. Export your guide to keep your changes.')
      }
    }
    const timer = setTimeout(save, 350)
    window.addEventListener('beforeunload', save)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeunload', save)
    }
  }, [doc, storageKey, hydrated, validation.valid, recoveryBlocked])

  useEffect(() => {
    if (!sourceDirty) return
    const warnUnsaved = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnUnsaved)
    return () => window.removeEventListener('beforeunload', warnUnsaved)
  }, [sourceDirty])

  function undo() {
    const previous = history.at(-1)
    if (!previous) return
    setFuture((items) => [doc, ...items])
    setHistory((items) => items.slice(0, -1))
    assign(previous)
    setChecks([])
  }
  function redo() {
    const next = future[0]
    if (!next) return
    setHistory((items) => [...items, doc])
    setFuture((items) => items.slice(1))
    assign(next)
    setChecks([])
  }
  function updateStep(patch: Partial<TourDocumentStep>) {
    if (!selected) return
    if (
      patch.id !== undefined &&
      doc.steps.some((step, index) => index !== selectedIndex && step.id === patch.id)
    ) {
      setError('Step IDs must be unique. This ID is already used.')
      return
    }
    commit({
      ...doc,
      steps: doc.steps.map((step, index) =>
        index === selectedIndex ? { ...step, ...patch } : step,
      ),
    })
    if (patch.id !== undefined) setSelectedId(patch.id)
  }
  function addStep() {
    const step: TourDocumentStep = {
      id: makeId(),
      target: '[data-tour="your-target"]',
      title: 'A little guidance',
      content: 'Explain what someone can do here, and why it matters.',
    }
    commit({ ...doc, steps: [...doc.steps, step] }, 'Step added. Pick a target in your app.')
    setSelectedId(step.id)
    setPanel('edit')
  }
  function moveStep(from: number, to: number) {
    if (from < 0 || to < 0 || to >= doc.steps.length || from === to) return
    const steps = [...doc.steps]
    const [step] = steps.splice(from, 1)
    if (step) steps.splice(to, 0, step)
    commit({ ...doc, steps })
  }
  function duplicateStep() {
    if (!selected || doc.steps.length >= 200) return
    const copy = { ...selected, id: makeId(), title: `${selected.title} (copy)` }
    const steps = [...doc.steps]
    steps.splice(selectedIndex + 1, 0, copy)
    commit({ ...doc, steps }, 'Step duplicated.')
    setSelectedId(copy.id)
  }
  function removeStep() {
    if (!selected) return
    const steps = doc.steps.filter((step) => step.id !== selected.id)
    commit({ ...doc, steps }, 'Step removed. Undo is available.')
    setSelectedId(steps[Math.min(selectedIndex, steps.length - 1)]?.id ?? '')
  }

  useEffect(() => {
    if (!picking) {
      setHoverRect(null)
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const move = (event: MouseEvent) => {
      if (event.target instanceof Element) setHoverRect(event.target.getBoundingClientRect())
    }
    const pick = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (!(event.target instanceof Element) || !canvas.contains(event.target)) return
      const target = getStudioSelector(event.target, canvas)
      const current = docRef.current
      const chosen = current.steps.find((step) => step.id === selectedId) ?? current.steps[0]
      if (!chosen) return
      commit(
        {
          ...current,
          steps: current.steps.map((step) => (step.id === chosen.id ? { ...step, target } : step)),
        },
        `Target selected: ${target}`,
      )
      setPicking(false)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPicking(false)
    }
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('click', pick, true)
    document.addEventListener('keydown', handleEscape)
    return () => {
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('click', pick, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [picking, selectedId, commit])

  function inspect() {
    let results: Check[]
    try {
      results = inspectTourTargets(doc, canvasRef.current ?? undefined).map((item) => ({
        id: item.stepId,
        title: doc.steps.find((step) => step.id === item.stepId)?.title ?? item.stepId,
        status: item.status,
        message: item.message,
      }))
    } catch (cause) {
      setError(prettyError(cause))
      return
    }
    setChecks(results)
    setPanel('checks')
    setNotice('Current-page inspection finished. No app actions were performed.')
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      if (file.size > MAX_TOUR_DOCUMENT_BYTES)
        throw new Error('Guide files must be smaller than 4 MB.')
      const imported = parseTourDocument(await file.text())
      commit(imported, `Imported ${file.name}.`)
      setSelectedId(imported.steps[0]?.id ?? '')
    } catch (cause) {
      setError(prettyError(cause))
    }
    event.target.value = ''
  }
  function exportFile() {
    try {
      const text = formatTourDocument(parseTourDocument(doc))
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `${doc.id || 'tour'}.tour.json`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('Exported your guide. Commit the JSON file alongside your app.')
    } catch (cause) {
      setError(prettyError(cause))
    }
  }
  function showPanel(next: Panel) {
    if (next === 'source' && !sourceDirty) setSource(JSON.stringify(doc, null, 2))
    setPanel(next)
  }
  function preview() {
    setPicking(false)
    clearRuntimeError()
    if (compiled.error) {
      setError(compiled.error)
      return
    }
    player.start(doc.id, { stepIndex: Math.max(0, selectedIndex) })
    setNotice('Previewing from the selected step. Escape stops the tour.')
  }

  return (
    <section className={`tl-studio ${className}`} aria-label="Tourlight Studio">
      <SpotlightTour
        id={doc.id}
        steps={compiled.steps}
        onComplete={() =>
          setNotice('Preview completed. Check the real task outcome in your app before shipping.')
        }
      />
      <header className="tls-toolbar">
        <div className="tls-brand">
          <span className="tls-mark" aria-hidden="true">
            t
          </span>
          <strong>
            tourlight<span> / studio</span>
          </strong>
        </div>
        <div className="tls-mode">
          <span className={player.isActive ? 'tls-dot tls-dot-live' : 'tls-dot'} />
          {player.isActive ? 'Previewing' : picking ? 'Picking target' : 'Editing'}
          <span className="tls-local">
            {sourceDirty
              ? 'Unapplied JSON · not saved'
              : storageKey
                ? saveState === 'saved'
                  ? 'Saved on this browser'
                  : saveState === 'failed'
                    ? 'Export to save'
                    : saveState === 'invalid'
                      ? 'Unsaved · invalid draft'
                      : saveState === 'saving'
                        ? 'Saving…'
                        : 'Local draft'
                : 'Source owned'}
          </span>
        </div>
        <div className="tls-actions">
          <button
            type="button"
            onClick={undo}
            disabled={!history.length || player.isActive}
            aria-label="Undo change"
            title="Undo"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!future.length || player.isActive}
            aria-label="Redo change"
            title="Redo"
          >
            ↷
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={player.isActive}>
            Import
          </button>
          <button
            type="button"
            onClick={exportFile}
            disabled={!validation.valid || player.isActive}
          >
            Export JSON <span aria-hidden="true">↗</span>
          </button>
          <button
            type="button"
            className="tls-primary"
            onClick={player.isActive ? player.stop : preview}
            disabled={!doc.steps.length}
          >
            {player.isActive ? 'Stop preview' : '▶ Preview'}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={importFile}
          hidden
          aria-label="Import tour JSON"
        />
      </header>
      <div className="tls-body">
        <aside className="tls-outline" aria-label="Tour steps">
          <div className="tls-outline-heading">
            <span className="tls-eyebrow">THE GUIDE</span>
            <span className="tls-count">{doc.steps.length} steps</span>
          </div>
          <label className="tls-sr-only" htmlFor={`${baseId}-name`}>
            Guide name
          </label>
          <textarea
            rows={2}
            id={`${baseId}-name`}
            className="tls-guide-name"
            value={doc.name}
            onChange={(e) => commit({ ...doc, name: e.target.value })}
            disabled={player.isActive}
          />
          <label className="tls-id-label">
            Guide ID
            <input
              value={doc.id}
              onChange={(e) => commit({ ...doc, id: e.target.value })}
              disabled={player.isActive}
              spellCheck={false}
            />
          </label>
          <ol className="tls-step-list">
            {doc.steps.map((step, index) => (
              <li
                key={step.id}
                draggable={!player.isActive}
                onDragStart={() => setDragId(step.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  moveStep(
                    doc.steps.findIndex((item) => item.id === dragId),
                    index,
                  )
                  setDragId(null)
                }}
              >
                <button
                  type="button"
                  className={`tls-step ${selected?.id === step.id ? 'tls-selected' : ''}`}
                  aria-current={selected?.id === step.id ? 'step' : undefined}
                  onClick={() => {
                    setSelectedId(step.id)
                    setPanel('edit')
                    setPicking(false)
                  }}
                  disabled={player.isActive}
                >
                  <span className="tls-step-number">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <strong>{step.title || 'Untitled step'}</strong>
                    <small>
                      {step.interactive || step.advanceOn ? 'Interactive' : 'Spotlight'}
                      {step.route ? ` · ${step.route}` : ''}
                    </small>
                  </span>
                  <span className="tls-grip" aria-hidden="true">
                    ⠿
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="tls-add"
            onClick={addStep}
            disabled={player.isActive || doc.steps.length >= 200}
          >
            ＋ Add a step
          </button>
          <div className="tls-outline-footer">
            <span className="tls-eyebrow">ONE DOCUMENT. EVERY WORKFLOW.</span>
            <p>
              Designed together.
              <br />
              Reviewed in Git.
              <br />
              Run in your app.
            </p>
            <button type="button" onClick={() => showPanel('connect')}>
              Connect your app <span aria-hidden="true">↗</span>
            </button>
          </div>
        </aside>
        <main className="tls-canvas-area">
          <div className="tls-canvas-bar">
            <span>
              <span className="tls-window-dots" aria-hidden="true">
                ● ● ●
              </span>{' '}
              Your application
            </span>
            <button type="button" onClick={inspect} disabled={player.isActive}>
              ◎ Inspect targets
            </button>
          </div>
          <div className={`tls-canvas ${picking ? 'tls-picking' : ''}`} ref={canvasRef}>
            {children}
          </div>
          <div className="tls-canvas-caption">
            <span>
              {picking
                ? 'Click an element to target it. Escape cancels. You can also enter a selector in the inspector.'
                : 'This is a live app. Interact with it, then pick the element you want to explain.'}
            </span>
            <span>LOCAL · NO ACCOUNT</span>
          </div>
        </main>
        <aside className="tls-inspector" aria-label="Step inspector">
          <div className="tls-tabs" aria-label="Inspector views">
            {(['edit', 'source', 'checks'] as const).map((tab) => (
              <button
                type="button"
                key={tab}
                aria-pressed={panel === tab}
                onClick={() => showPanel(tab)}
              >
                {tab === 'edit' ? 'Design' : tab === 'source' ? 'JSON' : 'Checks'}
                {tab === 'checks' && !validation.valid ? ' !' : ''}
              </button>
            ))}
          </div>
          <div className="tls-inspector-scroll">
            {panel === 'edit' && selected ? (
              <fieldset className="tls-fields" disabled={player.isActive}>
                <div className="tls-section-title">
                  <span className="tls-eyebrow">
                    STEP {String(selectedIndex + 1).padStart(2, '0')}
                  </span>
                  <div className="tls-mini-actions">
                    <button
                      type="button"
                      aria-label="Move step up"
                      disabled={selectedIndex <= 0}
                      onClick={() => moveStep(selectedIndex, selectedIndex - 1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Move step down"
                      disabled={selectedIndex === doc.steps.length - 1}
                      onClick={() => moveStep(selectedIndex, selectedIndex + 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={duplicateStep}
                      disabled={doc.steps.length >= 200}
                      title="Duplicate step"
                      aria-label="Duplicate step"
                    >
                      ⧉
                    </button>
                  </div>
                </div>
                <label>
                  Title
                  <input
                    value={selected.title}
                    onChange={(e) => updateStep({ title: e.target.value })}
                    placeholder="What should they notice?"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={4}
                    value={selected.content}
                    onChange={(e) => updateStep({ content: e.target.value })}
                    placeholder="Make the next action clear."
                  />
                </label>
                <div className="tls-field-heading">
                  <span>Target element</span>
                  <button
                    type="button"
                    className={picking ? 'tls-pick tls-pick-active' : 'tls-pick'}
                    onClick={() => setPicking((was) => !was)}
                  >
                    {picking ? 'Cancel picking' : '⌖ Pick element'}
                  </button>
                </div>
                <label className="tls-sr-only" htmlFor={`${baseId}-target`}>
                  Target selector
                </label>
                <input
                  id={`${baseId}-target`}
                  className="tls-code-input"
                  value={selected.target}
                  onChange={(e) => updateStep({ target: e.target.value })}
                  spellCheck={false}
                />
                <p className="tls-hint">
                  Use a stable <code>data-tour</code> attribute. A unique target survives layout
                  changes.
                </p>
                <label>
                  Placement
                  <select
                    value={selected.placement ?? 'auto'}
                    onChange={(e) =>
                      updateStep({ placement: e.target.value as TourDocumentStep['placement'] })
                    }
                  >
                    {['auto', 'top', 'bottom', 'left', 'right'].map((placement) => (
                      <option key={placement} value={placement}>
                        {placement[0]?.toUpperCase()}
                        {placement.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="tls-two-fields">
                  <label>
                    Padding
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selected.spotlightPadding ?? 8}
                      onChange={(e) => updateStep({ spotlightPadding: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Corner radius
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selected.spotlightRadius ?? 8}
                      onChange={(e) => updateStep({ spotlightRadius: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <div className="tls-divider" />
                <label className="tls-toggle">
                  <input
                    type="checkbox"
                    checked={!!selected.interactive || !!selected.advanceOn}
                    onChange={(e) =>
                      updateStep({
                        interactive: e.target.checked,
                        ...(!e.target.checked ? { advanceOn: undefined } : {}),
                      })
                    }
                  />
                  <span>
                    Let people interact<small>Use the real controls in your app.</small>
                  </span>
                </label>
                <label>
                  Advance when
                  <select
                    value={selected.advanceOn?.event ?? ''}
                    onChange={(e) =>
                      updateStep({
                        advanceOn: e.target.value
                          ? { event: e.target.value, selector: selected.advanceOn?.selector }
                          : undefined,
                        ...(e.target.value ? { interactive: true } : {}),
                      })
                    }
                  >
                    <option value="">They choose Next</option>
                    <option value="click">Target is clicked</option>
                    <option value="change">Value changes</option>
                    <option value="input">They type</option>
                    <option value="submit">Form is submitted</option>
                    {selected.advanceOn &&
                    !['click', 'change', 'input', 'submit'].includes(selected.advanceOn.event) ? (
                      <option value={selected.advanceOn.event}>{selected.advanceOn.event}</option>
                    ) : null}
                  </select>
                </label>
                {selected.advanceOn ? (
                  <label>
                    Event descendant selector (optional)
                    <input
                      value={selected.advanceOn.selector ?? ''}
                      onChange={(e) =>
                        updateStep({
                          advanceOn: {
                            event: selected.advanceOn?.event ?? 'click',
                            selector: e.target.value || undefined,
                          },
                        })
                      }
                      spellCheck={false}
                    />
                  </label>
                ) : null}
                <details className="tls-advanced">
                  <summary>Routes & developer hooks</summary>
                  <label>
                    Step ID
                    <input
                      value={selected.id}
                      onChange={(e) => {
                        updateStep({ id: e.target.value })
                      }}
                      spellCheck={false}
                    />
                  </label>
                  <label>
                    Route
                    <input
                      value={selected.route ?? ''}
                      onChange={(e) => updateStep({ route: e.target.value || undefined })}
                      placeholder="/projects"
                      spellCheck={false}
                    />
                  </label>
                  <label>
                    Wait timeout (ms)
                    <input
                      type="number"
                      min="0"
                      max="60000"
                      value={selected.timeout ?? 5000}
                      onChange={(e) => updateStep({ timeout: Number(e.target.value) })}
                    />
                  </label>
                  {(['condition', 'beforeStep', 'beforeShow', 'afterShow', 'onHide'] as const).map(
                    (key) => (
                      <label key={key}>
                        {key}
                        <input
                          value={selected[key] ?? ''}
                          onChange={(e) => updateStep({ [key]: e.target.value || undefined })}
                          placeholder="Registered handler name"
                          spellCheck={false}
                        />
                      </label>
                    ),
                  )}
                  <label>
                    Action label
                    <input
                      value={selected.action?.label ?? ''}
                      onChange={(e) =>
                        updateStep({
                          action: e.target.value
                            ? { label: e.target.value, handler: selected.action?.handler ?? '' }
                            : undefined,
                        })
                      }
                    />
                  </label>
                  {selected.action ? (
                    <label>
                      Action handler
                      <input
                        value={selected.action.handler}
                        onChange={(e) =>
                          updateStep({
                            action: {
                              label: selected.action?.label ?? '',
                              handler: e.target.value,
                            },
                          })
                        }
                        spellCheck={false}
                      />
                    </label>
                  ) : null}
                  <label className="tls-toggle">
                    <input
                      type="checkbox"
                      checked={!!selected.disableOverlayClose}
                      onChange={(e) => updateStep({ disableOverlayClose: e.target.checked })}
                    />
                    Keep open on overlay click
                  </label>
                  <p className="tls-hint">
                    Named hooks run only when your app registers them. JSON never contains
                    executable code.
                  </p>
                </details>
                <button type="button" className="tls-delete" onClick={removeStep}>
                  Remove step
                </button>
              </fieldset>
            ) : null}
            {panel === 'edit' && !selected ? (
              <div className="tls-empty">
                <span aria-hidden="true">✳</span>
                <h3>Every guide starts somewhere.</h3>
                <p>Add a step, then pick something in your app worth explaining.</p>
                <button type="button" className="tls-primary" onClick={addStep}>
                  Add your first step
                </button>
              </div>
            ) : null}
            {panel === 'source' ? (
              <div className="tls-source">
                <span className="tls-eyebrow">THE SHARED ARTIFACT</span>
                <h3>Your guide, as code.</h3>
                <p>
                  {sourceDirty
                    ? 'Unapplied JSON edits are preserved. Apply replaces the current guide. '
                    : ''}
                  Edit here, in your IDE, or with an agent. Apply validates the document before
                  replacing your draft.
                </p>
                <label className="tls-sr-only" htmlFor={`${baseId}-source`}>
                  Tour JSON
                </label>
                <textarea
                  id={`${baseId}-source`}
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value)
                    setSourceDirty(true)
                  }}
                  spellCheck={false}
                  rows={22}
                />
                <button
                  type="button"
                  className="tls-primary"
                  disabled={player.isActive}
                  onClick={() => {
                    try {
                      const parsed = parseTourDocument(source)
                      commit(parsed, 'JSON applied.')
                      setSourceDirty(false)
                      setSelectedId(parsed.steps[0]?.id ?? '')
                    } catch (cause) {
                      setError(prettyError(cause))
                    }
                  }}
                >
                  Apply JSON
                </button>
              </div>
            ) : null}
            {panel === 'checks' ? (
              <div className="tls-checks">
                <span className="tls-eyebrow">CONFIDENCE, NOT GUESSWORK</span>
                <h3>Check before you ship.</h3>
                <div className={`tls-check-card ${validation.valid ? 'tls-ready' : 'tls-invalid'}`}>
                  <strong>
                    {validation.valid ? '✓ Valid document' : '! Document needs attention'}
                  </strong>
                  <p>Schema validation checks structure and supported fields.</p>
                </div>
                {validation.issues.map((issue) => (
                  <p className="tls-issue" key={`${issue.path}-${issue.code}`}>
                    <code>{issue.path}</code> {issue.message}
                  </p>
                ))}
                {compiled.error ? <p className="tls-issue">Preview: {compiled.error}</p> : null}
                <button type="button" onClick={inspect}>
                  Inspect current-page targets
                </button>
                <p className="tls-hint">
                  Checks selectors and visibility now. Conditional elements and other routes need a
                  real scenario test.
                </p>
                {checks.map((check) => (
                  <button
                    type="button"
                    key={check.id}
                    className={`tls-check-card tls-${check.status}`}
                    onClick={() => {
                      setSelectedId(check.id)
                      setPanel('edit')
                    }}
                  >
                    <strong>
                      {check.status === 'ready' ? '✓' : '○'} {check.title}
                    </strong>
                    <span className="tls-check-status">{check.status}</span>
                    <p>{check.message}</p>
                  </button>
                ))}
                <div className="tls-check-card">
                  <strong>Browser scenario tests</strong>
                  <p>
                    Generate a Playwright target check with the CLI. Review setup, run it against
                    your app, then add the real interaction assertions.
                  </p>
                  <code>tourlight test guide.json --base-url http://localhost:3000</code>
                </div>
              </div>
            ) : null}
            {panel === 'connect' ? (
              <div className="tls-connect">
                <span className="tls-eyebrow">BRING YOUR OWN APP</span>
                <h3>Mount Studio where your product lives.</h3>
                <p>
                  Install the package and create an authoring route in your app. Wrap your app view
                  in TourStudio to pick real elements and preview guides.
                </p>
                <pre>
                  <code>{`import { TourStudio } from 'react-tourlight/studio'\nimport 'react-tourlight/studio.css'\nimport 'react-tourlight/styles.css'\n\n<TourStudio\n  defaultValue={guide}\n  storageKey="tour-draft"\n  onChange={setGuide}\n>\n  <YourApp />\n</TourStudio>`}</code>
                </pre>
                <p>
                  Keep this route for authors. Ship only the player and exported document to end
                  users. No account or Tourlight server is required.
                </p>
                <p>
                  Live picking works in the app where Studio is mounted. It does not connect to
                  arbitrary external URLs or cross-origin frames.
                </p>
                <button type="button" onClick={() => setPanel('edit')}>
                  Back to editing
                </button>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
      <footer className="tls-status">
        <span role="status">{notice || 'Ready when you are. Pick a step to begin.'}</span>
        <span>
          {validation.valid ? '✓ Valid schema' : '⚠ Check document'} · v{doc.schemaVersion}
        </span>
      </footer>
      {error || runtimeError ? (
        <div className="tls-error" role="alert">
          <span>{error || runtimeError}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => {
              setError('')
              clearRuntimeError()
            }}
          >
            ×
          </button>
        </div>
      ) : null}
      {picking && hoverRect ? (
        <div
          className="tls-pick-ring"
          style={{
            left: hoverRect.x - 3,
            top: hoverRect.y - 3,
            width: hoverRect.width + 6,
            height: hoverRect.height + 6,
          }}
        />
      ) : null}
    </section>
  )
}

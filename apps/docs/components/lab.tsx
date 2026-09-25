'use client'

import { StrictMode, useCallback, useEffect, useState } from 'react'
import { SpotlightProvider, SpotlightTour, useSpotlight } from 'react-tourlight'
import { useTour } from 'react-tourlight/core'
import 'react-tourlight/styles.css'

function HeadlessExample() {
  const tour = useTour({
    autoScroll: false,
    steps: [
      {
        target: '#headless-target',
        title: 'Headless target',
        content: 'Click the real button.',
        advanceOn: { event: 'click' },
      },
      { target: '#headless-result', title: 'Headless complete', content: 'The engine advanced.' },
    ],
  })
  return (
    <section aria-label="Headless laboratory" style={{ marginTop: 32 }}>
      <h2>Headless controller</h2>
      <button type="button" onClick={tour.start}>
        Start headless
      </button>{' '}
      <button id="headless-target" type="button">
        Headless action
      </button>{' '}
      <button id="headless-result" type="button">
        Headless destination
      </button>
      <output data-testid="headless-state">
        {tour.status}:{tour.currentIndex}:{tour.targetElement?.id ?? 'waiting'}
      </output>
      {tour.isActive && (
        <button type="button" onClick={tour.stop}>
          Stop headless
        </button>
      )}
    </section>
  )
}

function Laboratory({
  revision,
  onDelayed,
  completed,
}: {
  revision: number
  onDelayed: () => void
  completed: number
}) {
  const tour = useSpotlight()
  return (
    <>
      <header>
        <p
          style={{
            color: '#a9b3c5',
            fontSize: 12,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Tourlight / Runtime laboratory
        </p>
        <h1 style={{ fontSize: 40, fontWeight: 650, letterSpacing: '-0.04em', margin: '12px 0' }}>
          Reliability you can exercise.
        </h1>
        <p style={{ color: '#a9b3c5', maxWidth: 640 }}>
          Live browser fixtures for keyboard interaction, asynchronous targets, route changes,
          persistence and custom rendering.
        </p>
      </header>
      <nav
        aria-label="Scenarios"
        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '32px 0' }}
      >
        <button type="button" onClick={() => tour.start('basic')}>
          Start basic tour
        </button>
        <button type="button" onClick={() => tour.start('interactive')}>
          Start interactive tour
        </button>
        <button
          type="button"
          onClick={() => {
            onDelayed()
            tour.start('delayed')
          }}
        >
          Start delayed tour
        </button>
        <button type="button" onClick={() => tour.start('route')}>
          Start route tour
        </button>
        <button type="button" onClick={() => tour.start('tracking')}>
          Start tracking tour
        </button>
        <button type="button" onClick={() => tour.start('missing')}>
          Start missing target tour
        </button>
      </nav>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 24,
        }}
      >
        <section
          id="lab-workspace"
          style={{ padding: 28, background: '#172135', borderRadius: 18 }}
        >
          <h2>Workspace</h2>
          <p>A stable anchor during background rerenders.</p>
        </section>
        <section id="lab-editor" style={{ padding: 28, background: '#172135', borderRadius: 18 }}>
          <h2>Editor</h2>
          <label htmlFor="lab-input">Project name</label>
          <input
            id="lab-input"
            defaultValue="My project"
            style={{ display: 'block', marginTop: 12, width: '100%' }}
          />
        </section>
        <section id="lab-publish" style={{ padding: 28, background: '#172135', borderRadius: 18 }}>
          <h2>Publish</h2>
          <button id="lab-save" type="button">
            Save project
          </button>
        </section>
      </div>
      <div style={{ display: 'flex', gap: 24, marginTop: 24, color: '#a9b3c5' }}>
        <output data-testid="runtime-state">
          {tour.activeTourId ?? 'idle'}:{tour.currentStep}
        </output>
        <output data-testid="rerender-count">Rerenders: {revision}</output>
        <output data-testid="completed-count">Completed: {completed}</output>
      </div>
      <HeadlessExample />
    </>
  )
}

function LabRuntime() {
  const [revision, setRevision] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [delayed, setDelayed] = useState(false)
  const [destination, setDestination] = useState(false)
  const [targetGeneration, setTargetGeneration] = useState(0)
  const [targetMounted, setTargetMounted] = useState(true)
  const [shifted, setShifted] = useState(false)
  const [events, setEvents] = useState<string[]>([])
  useEffect(() => {
    const timer = window.setInterval(() => setRevision((value) => value + 1), 250)
    return () => window.clearInterval(timer)
  }, [])
  const navigate = useCallback((route: string) => {
    window.setTimeout(() => {
      window.history.replaceState(null, '', route)
      setDestination(true)
    }, 300)
  }, [])
  return (
    <SpotlightProvider
      persist
      persistKey="tourlight-runtime-lab"
      autoScroll={false}
      navigate={navigate}
      theme={{
        tooltip: { background: '#f8fafc', color: '#172135' },
        button: { background: '#6558f5' },
      }}
      onStepChange={(id, index) => setEvents((items) => [...items, `${id}:${index}`])}
      onError={(error) => setEvents((items) => [...items, `error:${String(error)}`])}
    >
      <SpotlightTour
        id="basic"
        steps={[
          {
            target: '#lab-workspace',
            title: 'Your workspace',
            content: 'This tour survives ordinary React rerenders.',
          },
          {
            target: '#lab-editor',
            title: 'Your editor',
            content: 'Progress survives a browser reload.',
          },
          { target: '#lab-publish', title: 'Ready to ship', content: 'Your app owns the runtime.' },
        ]}
        onComplete={() => setCompleted((value) => value + 1)}
      />
      <SpotlightTour
        id="interactive"
        steps={[
          {
            target: '#lab-editor',
            title: 'Name your project',
            content: 'Tab into the real field. Arrow keys edit text.',
            interactive: true,
          },
          {
            target: '#lab-save',
            title: 'Save it for real',
            content: 'Use the real Save project button to continue.',
            advanceOn: { event: 'click' },
          },
          {
            target: '#lab-workspace',
            title: 'Saved',
            content: 'The actual target event advanced the tour.',
          },
        ]}
      />
      <SpotlightTour
        id="delayed"
        steps={[
          {
            target: '#lab-delayed',
            title: 'Delayed target ready',
            content: 'Resolved after asynchronous setup.',
            onBeforeStep: async () => {
              await new Promise((resolve) => window.setTimeout(resolve, 600))
              setDelayed(true)
            },
          },
        ]}
      />
      <SpotlightTour
        id="route"
        steps={[
          {
            target: '#lab-route-target',
            route: '/lab/destination',
            title: 'Destination confirmed',
            content:
              'The old page also had this selector. The route was checked before accepting it.',
          },
        ]}
      />
      <SpotlightTour
        id="missing"
        steps={[
          {
            target: '#lab-never-exists',
            title: 'Never visible',
            content: 'This step must not be reported as viewed.',
            timeout: 150,
          },
          {
            target: '#lab-workspace',
            title: 'Recovered',
            content: 'Unavailable targets are skipped safely.',
          },
        ]}
      />
      <SpotlightTour
        id="tracking"
        steps={[
          {
            target: '#lab-moving',
            title: 'Track the live target',
            content: 'Move or replace the real element. The spotlight follows without restarting.',
            interactive: true,
            placement: 'top',
            timeout: 1000,
          },
        ]}
      />
      {targetMounted && (
        <section
          key={targetGeneration}
          id="lab-moving"
          data-generation={targetGeneration}
          style={{
            width: 320,
            padding: 20,
            margin: '16px 0',
            border: '1px solid #566079',
            borderRadius: 16,
            transform: shifted ? 'translate(100px, 30px)' : 'none',
          }}
        >
          <strong>Live target {targetGeneration}</strong>
          <br />
          <button type="button" onClick={() => setShifted((value) => !value)}>
            Move anchor
          </button>{' '}
          <button
            type="button"
            onClick={() => {
              setTargetMounted(false)
              window.setTimeout(() => {
                setTargetGeneration((value) => value + 1)
                setTargetMounted(true)
              }, 250)
            }}
          >
            Replace anchor
          </button>
        </section>
      )}
      <Laboratory revision={revision} completed={completed} onDelayed={() => setDelayed(false)} />
      {delayed && (
        <button id="lab-delayed" type="button" style={{ marginTop: 24 }}>
          Asynchronous target
        </button>
      )}
      <div
        id="lab-route-target"
        style={{ marginTop: 24, padding: 24, background: '#172135', borderRadius: 16 }}
      >
        {destination ? 'Destination route loaded' : 'Original route target'}
      </div>
      <output data-testid="viewed-events" style={{ display: 'block', marginTop: 24 }}>
        {events.join('|')}
      </output>
    </SpotlightProvider>
  )
}

export function RuntimeLab() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '48px clamp(20px, 6vw, 100px)',
        background: '#0d1422',
        color: '#edf2fa',
        fontFamily: 'system-ui',
      }}
    >
      <style>{`main button { border: 1px solid #566079; background: #222e46; color: #f8fafc; padding: 10px 14px; border-radius: 9px; cursor: pointer; } main button:focus-visible, main input:focus-visible { outline: 3px solid #a5a0ff; outline-offset: 3px; } main input { border: 1px solid #566079; background: #0d1422; color: #fff; padding: 10px; border-radius: 8px; }`}</style>
      <StrictMode>
        <LabRuntime />
      </StrictMode>
    </main>
  )
}

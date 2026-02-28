import type { SpotlightStep, TourState, TourStatus } from '../types.ts'

/** Listener callback for state changes */
type StateListener = (state: TourState) => void

/** Actions returned by the tour state machine */
export interface TourStateMachineActions {
  start: () => Promise<void>
  stop: () => void
  next: () => Promise<void>
  previous: () => Promise<void>
  skip: () => void
  goToStep: (index: number) => Promise<void>
  getState: () => TourState
  subscribe: (listener: StateListener) => () => void
}

/** Options for creating a tour state machine */
export interface TourStateMachineOptions {
  steps: SpotlightStep[]
  initialState?: Partial<TourState>
  onComplete?: () => void
  onSkip?: (stepIndex: number) => void
  onStateChange?: (state: TourState) => void
}

function createInitialState(overrides?: Partial<TourState>): TourState {
  return {
    status: 'idle',
    currentStepIndex: 0,
    seenSteps: [],
    ...overrides,
  }
}

/**
 * Creates a closure-based state machine for managing tour state.
 * Handles step transitions, async `when` predicates, and lifecycle callbacks.
 */
export function createTourStateMachine(options: TourStateMachineOptions): TourStateMachineActions {
  const { steps, onComplete, onSkip, onStateChange } = options

  let state = createInitialState(options.initialState)
  const listeners = new Set<StateListener>()

  function setState(partial: Partial<TourState>) {
    state = { ...state, ...partial }
    onStateChange?.(state)
    for (const listener of listeners) {
      listener(state)
    }
  }

  function setStatus(status: TourStatus) {
    setState({ status })
  }

  /**
   * Evaluates the `when` predicate on a step.
   * Returns true if the step should be shown (no predicate = always show).
   */
  async function shouldShowStep(step: SpotlightStep): Promise<boolean> {
    if (!step.when) return true
    return await step.when()
  }

  /**
   * Fires lifecycle callbacks for entering a step:
   * onBeforeShow (async) -> mark seen -> onAfterShow
   */
  async function enterStep(index: number) {
    const step = steps[index]
    if (!step) return

    await step.onBeforeShow?.()

    const seenSteps = state.seenSteps.includes(index)
      ? state.seenSteps
      : [...state.seenSteps, index]

    setState({ currentStepIndex: index, seenSteps })

    step.onAfterShow?.()
  }

  /** Fires the onHide callback for the current step */
  function leaveCurrentStep() {
    const step = steps[state.currentStepIndex]
    step?.onHide?.()
  }

  /**
   * Finds the next valid step index starting from `from` in the given direction.
   * Skips steps whose `when` predicate returns false.
   * Returns -1 if no valid step is found.
   */
  async function findValidStep(from: number, direction: 1 | -1): Promise<number> {
    let index = from
    while (index >= 0 && index < steps.length) {
      if (await shouldShowStep(steps[index])) {
        return index
      }
      index += direction
    }
    return -1
  }

  async function start() {
    if (state.status === 'active') return

    setStatus('active')

    const firstValid = await findValidStep(0, 1)
    if (firstValid === -1) {
      // No valid steps at all — complete immediately
      setState({
        status: 'completed',
        completedAt: Date.now(),
      })
      onComplete?.()
      return
    }

    await enterStep(firstValid)
  }

  function stop() {
    if (state.status !== 'active') return
    leaveCurrentStep()
    setStatus('idle')
  }

  async function next() {
    if (state.status !== 'active') return

    const nextIndex = await findValidStep(state.currentStepIndex + 1, 1)

    if (nextIndex === -1) {
      // No more steps — tour is complete
      leaveCurrentStep()
      setState({
        status: 'completed',
        completedAt: Date.now(),
      })
      onComplete?.()
      return
    }

    leaveCurrentStep()
    await enterStep(nextIndex)
  }

  async function previous() {
    if (state.status !== 'active') return

    const prevIndex = await findValidStep(state.currentStepIndex - 1, -1)

    if (prevIndex === -1) {
      // Already at the first valid step — do nothing
      return
    }

    leaveCurrentStep()
    await enterStep(prevIndex)
  }

  function skip() {
    if (state.status !== 'active') return

    const stepIndex = state.currentStepIndex
    leaveCurrentStep()
    setState({
      status: 'completed',
      skippedAt: { stepIndex, timestamp: Date.now() },
    })
    onSkip?.(stepIndex)
  }

  async function goToStep(index: number) {
    if (state.status !== 'active') return
    if (index < 0 || index >= steps.length) return

    if (!(await shouldShowStep(steps[index]))) return

    leaveCurrentStep()
    await enterStep(index)
  }

  function getState(): TourState {
    return state
  }

  function subscribe(listener: StateListener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  return {
    start,
    stop,
    next,
    previous,
    skip,
    goToStep,
    getState,
    subscribe,
  }
}

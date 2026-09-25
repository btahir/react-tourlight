import type { SpotlightStep, TourState } from '../types.ts'
import { runCallback } from '../utils/callback.ts'

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
  /** Cancel pending work without emitting a stop (for host unmounts). */
  dispose: () => void
}

/** Options for creating a tour state machine */
export interface TourStateMachineOptions {
  steps: SpotlightStep[]
  initialState?: Partial<TourState>
  onComplete?: () => void
  onSkip?: (stepIndex: number) => void
  onStateChange?: (state: TourState) => void
  /** Read the latest definitions without recreating an active machine. */
  getSteps?: () => SpotlightStep[]
  onError?: (error: unknown) => void
  /** UI adapters fire onAfterShow once the target is actually visible. */
  deferAfterShow?: boolean
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
  const { onComplete, onSkip, onStateChange } = options
  const getSteps = () => options.getSteps?.() ?? options.steps
  let generation = 0
  let transitioning = false
  let entered = false

  let state = createInitialState(options.initialState)
  const listeners = new Set<StateListener>()

  function setState(partial: Partial<TourState>) {
    state = { ...state, ...partial }
    onStateChange?.(state)
    for (const listener of listeners) {
      listener(state)
    }
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
  async function enterStep(index: number, token: number) {
    const step = getSteps()[index]
    if (!step) return

    await step.onBeforeShow?.()
    if (token !== generation || state.status !== 'active') return

    const seenSteps = state.seenSteps.includes(index)
      ? state.seenSteps
      : [...state.seenSteps, index]

    entered = true
    setState({ currentStepIndex: index, seenSteps, isTransitioning: false })

    if (!options.deferAfterShow) await step.onAfterShow?.()
  }

  /** Fires the onHide callback for the current step */
  function leaveCurrentStep() {
    if (!entered) return
    entered = false
    const step = getSteps()[state.currentStepIndex]
    runCallback(step?.onHide, (error) => options.onError?.(error))
  }

  /**
   * Finds the next valid step index starting from `from` in the given direction.
   * Skips steps whose `when` predicate returns false.
   * Returns -1 if no valid step is found.
   */
  async function findValidStep(from: number, direction: 1 | -1, token: number): Promise<number> {
    const steps = getSteps()
    let index = from
    while (index >= 0 && index < steps.length) {
      const show = await shouldShowStep(steps[index])
      if (token !== generation) return -1
      if (show) {
        return index
      }
      index += direction
    }
    return -1
  }

  async function transition(work: (token: number) => Promise<void>) {
    if (transitioning) return
    transitioning = true
    const token = ++generation
    try {
      await work(token)
    } catch (error) {
      if (token === generation) {
        entered = false
        setState({ status: 'idle', isTransitioning: false })
        options.onError?.(error)
      }
    } finally {
      if (token === generation) transitioning = false
    }
  }

  function complete() {
    leaveCurrentStep()
    setState({ status: 'completed', isTransitioning: false, completedAt: Date.now() })
    onComplete?.()
  }

  async function start() {
    if (state.status === 'active' || transitioning) return
    await transition(async (token) => {
      setState({
        status: 'active',
        isTransitioning: true,
        completedAt: undefined,
        skippedAt: undefined,
      })
      const steps = getSteps()
      const startIndex =
        Number.isInteger(state.currentStepIndex) &&
        state.currentStepIndex >= 0 &&
        state.currentStepIndex < steps.length
          ? state.currentStepIndex
          : 0
      const index = await findValidStep(startIndex, 1, token)
      if (token !== generation) return
      if (index === -1) complete()
      else await enterStep(index, token)
    })
  }

  function dispose() {
    generation++
    transitioning = false
  }

  function stop() {
    if (state.status !== 'active') return
    dispose()
    leaveCurrentStep()
    setState({ status: 'idle', isTransitioning: false })
  }

  async function move(direction: 1 | -1) {
    if (state.status !== 'active') return
    await transition(async (token) => {
      const index = await findValidStep(state.currentStepIndex + direction, direction, token)
      if (token !== generation) return
      if (index === -1) {
        if (direction === 1) complete()
        return
      }
      leaveCurrentStep()
      await enterStep(index, token)
    })
  }

  const next = () => move(1)
  const previous = () => move(-1)

  function skip() {
    if (state.status !== 'active') return
    dispose()
    const stepIndex = state.currentStepIndex
    leaveCurrentStep()
    setState({
      status: 'completed',
      isTransitioning: false,
      skippedAt: { stepIndex, timestamp: Date.now() },
    })
    onSkip?.(stepIndex)
  }

  async function goToStep(index: number) {
    if (
      state.status !== 'active' ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= getSteps().length ||
      index === state.currentStepIndex
    )
      return
    await transition(async (token) => {
      const show = await shouldShowStep(getSteps()[index])
      if (token !== generation || !show) return
      leaveCurrentStep()
      await enterStep(index, token)
    })
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
    dispose,
  }
}

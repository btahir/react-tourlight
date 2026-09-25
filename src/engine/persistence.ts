import type { SpotlightStorage, TourState } from '../types.ts'

/**
 * Bump this whenever the persisted envelope shape changes in a
 * backward-incompatible way. Older/newer envelopes are ignored (treated as
 * empty) rather than crashing.
 */
const SCHEMA_VERSION = 1

/** Default storage key used when `persist` is enabled without a `persistKey`. */
export const DEFAULT_PERSIST_KEY = 'react-tourlight'

/** A persisted tour state plus staleness metadata. */
export interface PersistedTourState extends TourState {
  /** Epoch ms when this snapshot was written. */
  savedAt: number
  /** Number of steps in the tour definition when saved (staleness guard). */
  stepCount: number
  /** Ordered stable IDs for detecting changes that preserve the step count. */
  stepIds?: string[]
}

interface PersistedEnvelope {
  v: number
  tours: Record<string, PersistedTourState>
}

/**
 * Creates an in-memory {@link SpotlightStorage}. Useful for tests, for
 * previews, or when you want persistence within a session but not across
 * reloads.
 */
export function createMemoryStorage(): SpotlightStorage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

/**
 * Resolves the `persist` prop into a concrete storage adapter (or `null` when
 * persistence is disabled / unavailable).
 *
 * - `undefined` / `false` → `null` (no persistence)
 * - `true` → `window.localStorage` (or `null` when unavailable, e.g. SSR)
 * - a {@link SpotlightStorage} object → used as-is
 */
export function resolveStorage(
  persist: boolean | SpotlightStorage | undefined,
): SpotlightStorage | null {
  if (!persist) return null
  if (persist === true) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null
      return window.localStorage
    } catch {
      // Accessing localStorage can throw (e.g. disabled cookies) — treat as
      // unavailable rather than crashing.
      return null
    }
  }
  return persist
}

function readEnvelope(storage: SpotlightStorage, key: string): PersistedEnvelope {
  try {
    const raw = storage.getItem(key)
    if (!raw) return { v: SCHEMA_VERSION, tours: {} }
    const parsed = JSON.parse(raw) as Partial<PersistedEnvelope>
    if (
      !parsed ||
      parsed.v !== SCHEMA_VERSION ||
      !parsed.tours ||
      typeof parsed.tours !== 'object' ||
      Array.isArray(parsed.tours)
    ) {
      return { v: SCHEMA_VERSION, tours: {} }
    }
    const tours = Object.fromEntries(
      Object.entries(parsed.tours).filter(([, state]) => {
        if (!state || typeof state !== 'object') return false
        return (
          ['idle', 'active', 'completed'].includes(state.status) &&
          Number.isInteger(state.currentStepIndex) &&
          state.currentStepIndex >= 0 &&
          Number.isInteger(state.stepCount) &&
          state.stepCount > 0 &&
          Number.isFinite(state.savedAt) &&
          Array.isArray(state.seenSteps) &&
          state.seenSteps.every((index: unknown) => Number.isInteger(index) && Number(index) >= 0)
        )
      }),
    )
    return { v: SCHEMA_VERSION, tours }
  } catch {
    // Corrupt/unreadable payload — start fresh.
    return { v: SCHEMA_VERSION, tours: {} }
  }
}

/** Reads all persisted tour states from storage. Never throws. */
export function loadPersistedTours(
  storage: SpotlightStorage,
  key: string,
): Record<string, PersistedTourState> {
  return readEnvelope(storage, key).tours
}

/** Writes a single tour's state to storage (merging with existing tours). */
export function savePersistedTour(
  storage: SpotlightStorage,
  key: string,
  tourId: string,
  state: TourState,
  stepCount: number,
  stepIds?: string[],
): void {
  try {
    const env = readEnvelope(storage, key)
    env.tours[tourId] = { ...state, savedAt: Date.now(), stepCount, stepIds }
    storage.setItem(key, JSON.stringify(env))
  } catch {
    // Storage full / unavailable — persistence is best-effort.
  }
}

/** Removes a single tour's persisted state from storage. */
export function clearPersistedTour(storage: SpotlightStorage, key: string, tourId: string): void {
  try {
    const env = readEnvelope(storage, key)
    if (tourId in env.tours) {
      delete env.tours[tourId]
      storage.setItem(key, JSON.stringify(env))
    }
  } catch {
    // Best-effort.
  }
}

/**
 * Returns whether a persisted snapshot is still safe to restore:
 * - the tour definition still has the same number of steps, and
 * - the persisted step index is in range, and
 * - the snapshot isn't older than `maxAge` (when provided).
 */
export function isPersistedStateFresh(
  state: PersistedTourState,
  stepCount: number,
  maxAge?: number,
  stepIds?: string[],
): boolean {
  if (!state || !Number.isInteger(state.currentStepIndex) || !Number.isFinite(state.savedAt))
    return false
  if (
    stepIds &&
    state.stepIds &&
    (state.stepIds.length !== stepIds.length ||
      stepIds.some((id, index) => state.stepIds?.[index] !== id))
  )
    return false
  if (state.stepCount !== stepCount) return false
  if (state.currentStepIndex < 0 || state.currentStepIndex >= stepCount) return false
  if (maxAge !== undefined && Date.now() - state.savedAt > maxAge) return false
  return true
}

/** Strips persistence metadata, returning a plain {@link TourState}. */
export function toTourState(persisted: PersistedTourState): TourState {
  const { savedAt: _savedAt, stepCount: _stepCount, stepIds: _stepIds, ...state } = persisted
  return state
}

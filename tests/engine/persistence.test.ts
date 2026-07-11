import {
  clearPersistedTour,
  createMemoryStorage,
  DEFAULT_PERSIST_KEY,
  isPersistedStateFresh,
  loadPersistedTours,
  type PersistedTourState,
  resolveStorage,
  savePersistedTour,
  toTourState,
} from '../../src/engine/persistence.ts'
import type { TourState } from '../../src/types.ts'

const activeState: TourState = {
  status: 'active',
  currentStepIndex: 2,
  seenSteps: [0, 1, 2],
}

describe('persistence', () => {
  describe('createMemoryStorage', () => {
    it('behaves like a minimal Web Storage adapter', () => {
      const s = createMemoryStorage()
      expect(s.getItem('missing')).toBeNull()
      s.setItem('k', 'v')
      expect(s.getItem('k')).toBe('v')
      s.removeItem('k')
      expect(s.getItem('k')).toBeNull()
    })
  })

  describe('resolveStorage', () => {
    it('returns null when persistence is disabled', () => {
      expect(resolveStorage(undefined)).toBeNull()
      expect(resolveStorage(false)).toBeNull()
    })

    it('returns localStorage when true', () => {
      expect(resolveStorage(true)).toBe(window.localStorage)
    })

    it('returns a custom storage object as-is', () => {
      const custom = createMemoryStorage()
      expect(resolveStorage(custom)).toBe(custom)
    })
  })

  describe('save / load round-trip', () => {
    it('saves and reloads a tour state with metadata', () => {
      const storage = createMemoryStorage()
      savePersistedTour(storage, DEFAULT_PERSIST_KEY, 'tour-a', activeState, 5)

      const loaded = loadPersistedTours(storage, DEFAULT_PERSIST_KEY)
      expect(loaded['tour-a']).toMatchObject({
        status: 'active',
        currentStepIndex: 2,
        stepCount: 5,
      })
      expect(typeof loaded['tour-a'].savedAt).toBe('number')
    })

    it('merges multiple tours under one key', () => {
      const storage = createMemoryStorage()
      savePersistedTour(storage, DEFAULT_PERSIST_KEY, 'tour-a', activeState, 5)
      savePersistedTour(storage, DEFAULT_PERSIST_KEY, 'tour-b', activeState, 3)

      const loaded = loadPersistedTours(storage, DEFAULT_PERSIST_KEY)
      expect(Object.keys(loaded).sort()).toEqual(['tour-a', 'tour-b'])
    })

    it('clears a single tour', () => {
      const storage = createMemoryStorage()
      savePersistedTour(storage, DEFAULT_PERSIST_KEY, 'tour-a', activeState, 5)
      savePersistedTour(storage, DEFAULT_PERSIST_KEY, 'tour-b', activeState, 3)
      clearPersistedTour(storage, DEFAULT_PERSIST_KEY, 'tour-a')

      const loaded = loadPersistedTours(storage, DEFAULT_PERSIST_KEY)
      expect(loaded['tour-a']).toBeUndefined()
      expect(loaded['tour-b']).toBeDefined()
    })

    it('returns an empty object for corrupt payloads', () => {
      const storage = createMemoryStorage()
      storage.setItem(DEFAULT_PERSIST_KEY, '{not json')
      expect(loadPersistedTours(storage, DEFAULT_PERSIST_KEY)).toEqual({})
    })

    it('ignores payloads from a different schema version', () => {
      const storage = createMemoryStorage()
      storage.setItem(DEFAULT_PERSIST_KEY, JSON.stringify({ v: 999, tours: { x: {} } }))
      expect(loadPersistedTours(storage, DEFAULT_PERSIST_KEY)).toEqual({})
    })
  })

  describe('isPersistedStateFresh', () => {
    const base: PersistedTourState = { ...activeState, savedAt: Date.now(), stepCount: 5 }

    it('is fresh when step count matches and index is in range', () => {
      expect(isPersistedStateFresh(base, 5)).toBe(true)
    })

    it('is stale when the step count changed (tour definition changed)', () => {
      expect(isPersistedStateFresh(base, 4)).toBe(false)
    })

    it('is stale when the step index is out of range', () => {
      expect(isPersistedStateFresh({ ...base, currentStepIndex: 10 }, 5)).toBe(false)
    })

    it('is stale when older than maxAge', () => {
      const old = { ...base, savedAt: Date.now() - 10_000 }
      expect(isPersistedStateFresh(old, 5, 1_000)).toBe(false)
      expect(isPersistedStateFresh(old, 5, 100_000)).toBe(true)
    })
  })

  describe('toTourState', () => {
    it('strips persistence metadata', () => {
      const persisted: PersistedTourState = { ...activeState, savedAt: 123, stepCount: 5 }
      const state = toTourState(persisted)
      expect(state).toEqual(activeState)
      expect('savedAt' in state).toBe(false)
      expect('stepCount' in state).toBe(false)
    })
  })
})

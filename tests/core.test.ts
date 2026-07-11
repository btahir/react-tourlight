import * as coreApi from '../src/core.ts'

describe('headless core entry (src/core.ts)', () => {
  it('exports the engine + geometry primitives', () => {
    expect(coreApi.createTourStateMachine).toBeTypeOf('function')
    expect(coreApi.waitForElement).toBeTypeOf('function')
    expect(coreApi.resolveTarget).toBeTypeOf('function')
    expect(coreApi.getTargetRect).toBeTypeOf('function')
    expect(coreApi.measureElement).toBeTypeOf('function')
    expect(coreApi.generateClipPath).toBeTypeOf('function')
    expect(coreApi.generateEmptyClipPath).toBeTypeOf('function')
  })

  it('exports focus/a11y + keyboard utilities', () => {
    expect(coreApi.createFocusTrap).toBeTypeOf('function')
    expect(coreApi.setInert).toBeTypeOf('function')
    expect(coreApi.getStepAriaLabel).toBeTypeOf('function')
    expect(coreApi.createKeyboardHandler).toBeTypeOf('function')
    expect(coreApi.scrollIntoView).toBeTypeOf('function')
  })

  it('exports route + persistence helpers', () => {
    expect(coreApi.getCurrentPath).toBeTypeOf('function')
    expect(coreApi.isRouteActive).toBeTypeOf('function')
    expect(coreApi.createMemoryStorage).toBeTypeOf('function')
    expect(coreApi.resolveStorage).toBeTypeOf('function')
    expect(coreApi.loadPersistedTours).toBeTypeOf('function')
    expect(coreApi.savePersistedTour).toBeTypeOf('function')
    expect(coreApi.clearPersistedTour).toBeTypeOf('function')
    expect(coreApi.isPersistedStateFresh).toBeTypeOf('function')
    expect(coreApi.toTourState).toBeTypeOf('function')
    expect(coreApi.DEFAULT_PERSIST_KEY).toBe('react-tourlight')
  })

  it('exports the headless useTour hook', () => {
    expect(coreApi.useTour).toBeTypeOf('function')
  })

  it('does not pull @floating-ui into its module graph', async () => {
    // If /core imported the styled tooltip (which imports Floating UI), this
    // module graph would contain it. We assert the source module doesn't
    // reference the tooltip entry that pulls Floating UI.
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/core.ts'), 'utf8')
    expect(source).not.toContain('spotlight-tooltip')
    expect(source).not.toContain('floating-ui')
  })
})

import * as publicApi from '../src/index.ts'

describe('public entry (src/index.ts)', () => {
  it('exports the documented component/hook/theme API', () => {
    expect(publicApi.SpotlightProvider).toBeTypeOf('function')
    expect(publicApi.SpotlightTour).toBeTypeOf('function')
    expect(publicApi.SpotlightHighlight).toBeTypeOf('function')
    expect(publicApi.useSpotlight).toBeTypeOf('function')
    expect(publicApi.useSpotlightControl).toBeTypeOf('function')
    expect(publicApi.useSpotlightTarget).toBeTypeOf('function')
    expect(publicApi.resolveTheme).toBeTypeOf('function')
    expect(publicApi.lightTheme).toBeTypeOf('object')
    expect(publicApi.darkTheme).toBeTypeOf('object')
  })

  it('exports engine and overlay primitives for building custom tour UIs', () => {
    expect(publicApi.createTourStateMachine).toBeTypeOf('function')
    expect(publicApi.waitForElement).toBeTypeOf('function')
    expect(publicApi.getTargetRect).toBeTypeOf('function')
    expect(publicApi.resolveTarget).toBeTypeOf('function')
    expect(publicApi.measureElement).toBeTypeOf('function')
    expect(publicApi.generateClipPath).toBeTypeOf('function')
  })
})

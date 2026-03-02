import { render } from '@testing-library/react'
import { SpotlightHighlight } from '../../src/components/spotlight-highlight.tsx'
import { SpotlightContext } from '../../src/components/spotlight-provider.tsx'
import type { SpotlightContextValue } from '../../src/types.ts'

// Mock scrollIntoView (used by SpotlightProvider's highlight)
vi.mock('../../src/utils/scroll-into-view.ts', () => ({
  scrollIntoView: vi.fn(() => Promise.resolve()),
}))

function createMockContext(overrides: Partial<SpotlightContextValue> = {}): SpotlightContextValue {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    skip: vi.fn(),
    goToStep: vi.fn(),
    isActive: false,
    activeTourId: null,
    currentStep: 0,
    totalSteps: 0,
    registerTour: vi.fn(),
    unregisterTour: vi.fn(),
    highlight: vi.fn(),
    dismissHighlight: vi.fn(),
    ...overrides,
  }
}

describe('SpotlightHighlight', () => {
  let targetElement: HTMLElement

  beforeEach(() => {
    targetElement = document.createElement('div')
    targetElement.id = 'highlight-target'
    document.body.appendChild(targetElement)
  })

  afterEach(() => {
    document.body.removeChild(targetElement)
  })

  it('throws error when used outside SpotlightProvider', () => {
    // Suppress console.error from React's error boundary
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<SpotlightHighlight target="#highlight-target" title="Title" content="Content" />)
    }).toThrow('react-tourlight: <SpotlightHighlight> must be used within a <SpotlightProvider>.')

    spy.mockRestore()
  })

  it('renders nothing (returns null)', () => {
    const mockContext = createMockContext()

    const { container } = render(
      <SpotlightContext.Provider value={mockContext}>
        <SpotlightHighlight target="#highlight-target" title="Title" content="Content" />
      </SpotlightContext.Provider>,
    )

    expect(container.innerHTML).toBe('')
  })

  it('calls highlight when active=true', () => {
    const highlight = vi.fn()
    const mockContext = createMockContext({ highlight })

    render(
      <SpotlightContext.Provider value={mockContext}>
        <SpotlightHighlight
          target="#highlight-target"
          title="Title"
          content="Content"
          active={true}
        />
      </SpotlightContext.Provider>,
    )

    expect(highlight).toHaveBeenCalledTimes(1)
    expect(highlight).toHaveBeenCalledWith(
      expect.objectContaining({
        target: '#highlight-target',
        title: 'Title',
        content: 'Content',
      }),
    )
  })

  it('calls dismissHighlight when active changes to false', () => {
    const highlight = vi.fn()
    const dismissHighlight = vi.fn()
    const mockContext = createMockContext({ highlight, dismissHighlight })

    const { rerender } = render(
      <SpotlightContext.Provider value={mockContext}>
        <SpotlightHighlight
          target="#highlight-target"
          title="Title"
          content="Content"
          active={true}
        />
      </SpotlightContext.Provider>,
    )

    expect(highlight).toHaveBeenCalledTimes(1)

    rerender(
      <SpotlightContext.Provider value={mockContext}>
        <SpotlightHighlight
          target="#highlight-target"
          title="Title"
          content="Content"
          active={false}
        />
      </SpotlightContext.Provider>,
    )

    expect(dismissHighlight).toHaveBeenCalledTimes(1)
  })
})

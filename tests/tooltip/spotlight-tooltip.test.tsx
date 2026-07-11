import { render, screen } from '@testing-library/react'
import { lightTheme } from '../../src/themes/default-light.ts'
import { SpotlightTooltip } from '../../src/tooltip/spotlight-tooltip.tsx'
import type { SpotlightStep } from '../../src/types.ts'

// Mock @floating-ui/react-dom to return stable values
vi.mock('@floating-ui/react-dom', () => ({
  useFloating: () => ({
    refs: {
      setFloating: vi.fn(),
      setReference: vi.fn(),
    },
    floatingStyles: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
    },
    placement: 'bottom' as const,
    middlewareData: {
      arrow: { x: 10, y: undefined },
    },
  }),
  autoUpdate: vi.fn(),
  offset: () => ({}),
  flip: () => ({}),
  shift: () => ({}),
  arrow: () => ({}),
}))

const baseStep: SpotlightStep = {
  target: '#test-target',
  title: 'Test Title',
  content: 'Test content body',
}

const defaultProps = {
  step: baseStep,
  currentIndex: 0,
  totalSteps: 3,
  onNext: vi.fn(),
  onPrevious: vi.fn(),
  onSkip: vi.fn(),
  onClose: vi.fn(),
  theme: lightTheme,
}

describe('SpotlightTooltip', () => {
  let targetElement: HTMLElement

  beforeEach(() => {
    targetElement = document.createElement('div')
    targetElement.id = 'test-target'
    document.body.appendChild(targetElement)
  })

  afterEach(() => {
    document.body.removeChild(targetElement)
  })

  it('returns null when targetElement is null', () => {
    const { container } = render(<SpotlightTooltip {...defaultProps} targetElement={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders with role="dialog" when targetElement is provided', () => {
    render(<SpotlightTooltip {...defaultProps} targetElement={targetElement} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('sets aria-labelledby/aria-describedby to the ids of the rendered title/content elements', () => {
    render(<SpotlightTooltip {...defaultProps} targetElement={targetElement} />)
    const dialog = screen.getByRole('dialog')
    const labelledBy = dialog.getAttribute('aria-labelledby')
    const describedBy = dialog.getAttribute('aria-describedby')

    expect(labelledBy).toBeTruthy()
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(labelledBy as string)).toHaveTextContent('Test Title')
    expect(document.getElementById(describedBy as string)).toHaveTextContent('Test content body')
  })

  it('omits aria-labelledby/aria-describedby when a custom renderTooltip is used, avoiding dangling refs', () => {
    const renderTooltip = () => <div data-testid="custom-tooltip">Custom</div>

    render(
      <SpotlightTooltip
        {...defaultProps}
        targetElement={targetElement}
        renderTooltip={renderTooltip}
      />,
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toHaveAttribute('aria-labelledby')
    expect(dialog).not.toHaveAttribute('aria-describedby')
  })

  it('generates unique title/content ids across simultaneously rendered instances', () => {
    const targetElement2 = document.createElement('div')
    targetElement2.id = 'test-target-2'
    document.body.appendChild(targetElement2)

    render(
      <>
        <SpotlightTooltip {...defaultProps} targetElement={targetElement} />
        <SpotlightTooltip {...defaultProps} targetElement={targetElement2} />
      </>,
    )

    const dialogs = screen.getAllByRole('dialog')
    expect(dialogs).toHaveLength(2)

    const [firstLabelledBy, secondLabelledBy] = dialogs.map((dialog) =>
      dialog.getAttribute('aria-labelledby'),
    )
    expect(firstLabelledBy).toBeTruthy()
    expect(secondLabelledBy).toBeTruthy()
    expect(firstLabelledBy).not.toBe(secondLabelledBy)

    document.body.removeChild(targetElement2)
  })

  it('sets theme hover CSS custom properties on the tooltip element', () => {
    render(<SpotlightTooltip {...defaultProps} targetElement={targetElement} />)
    const dialog = screen.getByRole('dialog')

    expect(dialog.style.getPropertyValue('--spotlight-btn-hover-bg')).toBe(
      lightTheme.button.hoverBackground,
    )
    expect(dialog.style.getPropertyValue('--spotlight-btn-secondary-hover-bg')).toBe(
      lightTheme.buttonSecondary.hoverBackground,
    )
    expect(dialog.style.getPropertyValue('--spotlight-close-hover-color')).toBe(
      lightTheme.closeButton.hoverColor,
    )
  })

  it('renders step title and content', () => {
    render(<SpotlightTooltip {...defaultProps} targetElement={targetElement} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test content body')).toBeInTheDocument()
  })

  it('renders custom tooltip via renderTooltip prop', () => {
    const renderTooltip = vi.fn(({ step }) => (
      <div data-testid="custom-tooltip">{step.title} custom</div>
    ))

    render(
      <SpotlightTooltip
        {...defaultProps}
        targetElement={targetElement}
        renderTooltip={renderTooltip}
      />,
    )

    expect(screen.getByTestId('custom-tooltip')).toBeInTheDocument()
    expect(screen.getByText('Test Title custom')).toBeInTheDocument()
    expect(renderTooltip).toHaveBeenCalledWith(
      expect.objectContaining({
        step: baseStep,
        currentIndex: 0,
        totalSteps: 3,
      }),
    )
  })

  it('applies theme styles', () => {
    render(<SpotlightTooltip {...defaultProps} targetElement={targetElement} />)
    const dialog = screen.getByRole('dialog')
    // jsdom normalizes hex colors to rgb, so check with toHaveStyle
    expect(dialog).toHaveStyle({ background: lightTheme.tooltip.background })
    expect(dialog).toHaveStyle({ color: lightTheme.tooltip.color })
    expect(dialog.style.borderRadius).toBe(lightTheme.tooltip.borderRadius)
  })
})

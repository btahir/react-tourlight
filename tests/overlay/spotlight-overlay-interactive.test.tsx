import { fireEvent, render } from '@testing-library/react'
import { SpotlightOverlay } from '../../src/overlay/spotlight-overlay.tsx'
import type { ElementRect } from '../../src/types.ts'

const targetRect: ElementRect = { x: 100, y: 200, width: 300, height: 150 }

describe('SpotlightOverlay (interactive pass-through)', () => {
  it('makes the visual overlay pointer-events:none when interactive with a target', () => {
    const { container } = render(<SpotlightOverlay targetRect={targetRect} interactive />)
    const overlay = container.querySelector('.spotlight-overlay') as HTMLElement
    expect(overlay.style.pointerEvents).toBe('none')
  })

  it('keeps pointer-events auto for interactive when there is no target yet', () => {
    const { container } = render(<SpotlightOverlay targetRect={null} interactive />)
    const overlay = container.querySelector('.spotlight-overlay') as HTMLElement
    expect(overlay.style.pointerEvents).toBe('auto')
  })

  it('renders four transparent blocker rectangles around the target', () => {
    const { container } = render(<SpotlightOverlay targetRect={targetRect} interactive />)
    const blockers = container.querySelectorAll('.spotlight-overlay-blocker')
    expect(blockers).toHaveLength(4)
    for (const b of Array.from(blockers)) {
      expect((b as HTMLElement).style.pointerEvents).toBe('auto')
      expect((b as HTMLElement).style.background).toBe('transparent')
    }
  })

  it('does not render blockers in non-interactive mode', () => {
    const { container } = render(<SpotlightOverlay targetRect={targetRect} />)
    expect(container.querySelectorAll('.spotlight-overlay-blocker')).toHaveLength(0)
  })

  it('positions blockers to leave the target rect uncovered (a genuine hole)', () => {
    const { container } = render(<SpotlightOverlay targetRect={targetRect} interactive />)
    const styles = Array.from(container.querySelectorAll('.spotlight-overlay-blocker')).map(
      (b) => (b as HTMLElement).style,
    )
    // top blocker height equals the gap above the target
    const top = styles.find((s) => s.height === '200px')
    expect(top).toBeDefined()
    // left blocker width equals the gap to the left of the target
    const left = styles.find((s) => s.width === '100px')
    expect(left).toBeDefined()
    // bottom blocker starts at the bottom edge of the target
    const bottom = styles.find((s) => s.top === '350px')
    expect(bottom).toBeDefined()
    // right blocker starts at the right edge of the target
    const right = styles.find((s) => s.left === '400px')
    expect(right).toBeDefined()
  })

  it('dismisses via a blocker click', () => {
    const onClick = vi.fn()
    const { container } = render(
      <SpotlightOverlay targetRect={targetRect} interactive onClick={onClick} />,
    )
    const blocker = container.querySelector('.spotlight-overlay-blocker') as HTMLElement
    fireEvent.click(blocker)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('keeps the clip-path spotlight visual identical to non-interactive mode', () => {
    const nonInteractive = render(
      <SpotlightOverlay targetRect={targetRect} padding={8} radius={4} />,
    )
    const interactive = render(
      <SpotlightOverlay targetRect={targetRect} padding={8} radius={4} interactive />,
    )
    const a = nonInteractive.container.querySelector('.spotlight-overlay') as HTMLElement
    const b = interactive.container.querySelector('.spotlight-overlay') as HTMLElement
    expect(b.style.clipPath).toBe(a.style.clipPath)
  })
})

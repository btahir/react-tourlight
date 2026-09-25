import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TourChecklist, TourLauncher } from '../../src/guidance/components.tsx'

const start = vi.fn()
vi.mock('../../src/hooks/use-spotlight.ts', () => ({
  useSpotlight: () => ({ start, isActive: false }),
}))
const items = [
  {
    id: 'project',
    tourId: 'project-tour',
    title: 'Create a project',
    description: 'Give your idea a home',
    completed: true,
  },
  {
    id: 'invite',
    tourId: 'invite-tour',
    title: 'Invite your people',
    description: 'Work together',
    completed: false,
  },
]

describe('source-owned guidance companions', () => {
  it('uses app completion state and replays without changing task completion', () => {
    const onSelect = vi.fn()
    render(<TourChecklist items={items} onSelect={onSelect} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1')
    fireEvent.click(
      screen.getByRole('button', { name: 'Create a project, completed. Replay guide' }),
    )
    expect(start).toHaveBeenCalledWith('project-tour')
    expect(onSelect).toHaveBeenCalledWith(items[0])
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1')
  })

  it('searches title and description and starts the matched guide', () => {
    render(<TourLauncher items={items} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'together' } })
    expect(screen.queryByRole('button', { name: /Create a project/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Invite your people/ }))
    expect(start).toHaveBeenCalledWith('invite-tour')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nothing' } })
    expect(screen.getByRole('status')).toHaveTextContent('No guides match your search.')
  })
})

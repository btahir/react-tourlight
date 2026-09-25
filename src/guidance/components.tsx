'use client'

import { useId, useState } from 'react'
import { useSpotlight } from '../hooks/use-spotlight.ts'

export interface GuideItem {
  id: string
  tourId: string
  title: string
  description?: string
  /** Application-owned completion. Seeing a tooltip does not complete a business task. */
  completed?: boolean
}

export interface TourChecklistProps {
  items: GuideItem[]
  title?: string
  description?: string
  className?: string
  /** Called alongside starting the registered tour, useful for analytics. */
  onSelect?: (item: GuideItem) => void
}

/** An inline onboarding checklist; mount under SpotlightProvider and register each tour. */
export function TourChecklist({
  items,
  title = 'Make yourself at home',
  description = 'A few small steps to get you started.',
  className = '',
  onSelect,
}: TourChecklistProps) {
  const { start, isActive } = useSpotlight()
  const labelId = useId()
  const completed = items.filter((item) => item.completed).length
  return (
    <section className={`tl-guidance tl-checklist ${className}`} aria-labelledby={labelId}>
      <div className="tlg-kicker">YOUR NEXT GOOD STEP</div>
      <h2 id={labelId}>{title}</h2>
      <p>{description}</p>
      <div className="tlg-progress-label">
        <span>
          {completed} of {items.length} complete
        </span>
        <span>{items.length ? Math.round((completed / items.length) * 100) : 0}%</span>
      </div>
      <progress
        value={completed}
        max={Math.max(1, items.length)}
        aria-label={`${completed} of ${items.length} tasks complete`}
      />
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={isActive}
              onClick={() => {
                onSelect?.(item)
                start(item.tourId)
              }}
              aria-label={`${item.title}${item.completed ? ', completed. Replay guide' : ', start guide'}`}
            >
              <span
                className={`tlg-check ${item.completed ? 'tlg-complete' : ''}`}
                aria-hidden="true"
              >
                {item.completed ? '✓' : ''}
              </span>
              <span>
                <strong>{item.title}</strong>
                {item.description ? <small>{item.description}</small> : null}
              </span>
              <span aria-hidden="true" className="tlg-arrow">
                ↗
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!items.length ? <p>No tasks to complete.</p> : null}
    </section>
  )
}

export interface TourLauncherProps extends Omit<TourChecklistProps, 'description'> {
  placeholder?: string
  emptyMessage?: string
}

/** A searchable, inline guide library. No hidden network, storage, or global shortcut. */
export function TourLauncher({
  items,
  title = 'A little help, right here.',
  placeholder = 'Find a guide…',
  emptyMessage = 'No guides match your search.',
  className = '',
  onSelect,
}: TourLauncherProps) {
  const { start, isActive } = useSpotlight()
  const [query, setQuery] = useState('')
  const id = useId()
  const filtered = items.filter((item) =>
    `${item.title} ${item.description ?? ''}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase().trim()),
  )
  return (
    <section className={`tl-guidance tl-launcher ${className}`} aria-labelledby={`${id}-title`}>
      <div className="tlg-kicker">EXPLORE AT YOUR OWN PACE</div>
      <h2 id={`${id}-title`}>{title}</h2>
      <label className="tlg-search">
        <span className="tlg-sr-only">Search guides</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      <ul>
        {filtered.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={isActive}
              onClick={() => {
                onSelect?.(item)
                start(item.tourId)
              }}
            >
              <span>
                <strong>{item.title}</strong>
                {item.description ? <small>{item.description}</small> : null}
              </span>
              <span className="tlg-arrow" aria-hidden="true">
                {item.completed ? '↻' : '↗'}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? <p role="status">{emptyMessage}</p> : null}
    </section>
  )
}

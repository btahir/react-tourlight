import type { Metadata } from 'next'
import Link from 'next/link'
import { GuidanceDemo } from '@/components/guidance-demo'

export const metadata: Metadata = {
  title: 'Guides, right where you need them',
  description:
    'Try Tourlight checklists and a searchable guide launcher with real application state.',
}

export default function GuidancePage() {
  return (
    <main className="tl-site tl-guidance-page">
      <header className="tl-nav tl-container">
        <Link className="tl-brand" href="/">
          <span className="tl-brand-mark" aria-hidden="true">
            t
          </span>
          <span>
            tourlight<span className="tl-brand-react">for React</span>
          </span>
        </Link>
        <nav aria-label="Guidance navigation">
          <Link href="/docs/guidance">Component docs</Link>
          <Link className="tl-button tl-button-small" href="/studio">
            Open Studio ↗
          </Link>
        </nav>
      </header>
      <section className="tl-container tl-guidance-intro">
        <span className="tl-eyebrow">COMPANION COMPONENTS / LIVE DEMO</span>
        <h1>
          A little help.
          <br />
          <em>Right where you need it.</em>
        </h1>
        <p>
          Try a guide from the checklist or search the library. Complete the tasks in this sample
          workspace to see the checklist update. Finishing a tooltip alone won’t check off the task.
        </p>
      </section>
      <GuidanceDemo />
      <footer className="tl-container tl-guidance-demo-footer">
        <p>Demo state lives in memory. No accounts, messages, or external services.</p>
        <Link className="tl-text-link" href="/docs/guidance">
          Add these components to your app ↗
        </Link>
      </footer>
    </main>
  )
}

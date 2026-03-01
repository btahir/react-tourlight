import Link from 'next/link'
import { AnimateOnScroll } from '@/components/animate-on-scroll'
import { InteractiveTour, TourTriggerButton } from '@/components/demo/interactive-tour'

export default function HomePage() {
  return (
    <main
      className="font-body flex min-h-screen flex-col"
      style={{ fontFamily: 'var(--font-body)', background: 'var(--color-surface)' }}
    >
      {/* ─── NAV ─── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md sm:px-12 lg:px-24"
        style={{
          background: 'rgba(12, 12, 14, 0.8)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <Link
          href="/"
          className="font-display text-lg tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          react-spotlight
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/docs"
            className="text-sm transition-colors hover:text-white"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Docs
          </Link>
          <a
            href="https://github.com/bilaltahir/react-spotlight"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-colors hover:text-white"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            GitHub
          </a>
          <TourTriggerButton
            className="rounded-md px-4 py-1.5 text-sm font-medium transition-all hover:brightness-110"
            style={{
              background: 'var(--color-amber)',
              color: 'var(--color-surface)',
            }}
          />
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section
        data-tour="hero"
        className="grain relative flex flex-col items-start overflow-hidden px-6 pb-24 pt-20 sm:px-12 lg:px-24"
      >
        {/* Warm radial glow — top right */}
        <div
          className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-amber) 0%, transparent 70%)' }}
        />
        {/* Subtle cool glow — bottom left */}
        <div
          className="absolute -bottom-60 -left-40 h-[500px] w-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }}
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          {/* Version pill */}
          <div
            className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
            style={{
              border: '1px solid var(--color-border-accent)',
              color: 'var(--color-amber-light)',
              background: 'rgba(245, 158, 11, 0.06)',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--color-amber)' }}
            />
            v0.1.0 — Now available
          </div>

          {/* Headline — Instrument Serif, oversized, italic accent */}
          <h1 data-tour="headline" className="animate-fade-in-up delay-100 max-w-4xl leading-[0.95]">
            <span
              className="font-display block text-6xl tracking-tight sm:text-8xl lg:text-9xl"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Onboarding tours
            </span>
            <span
              className="font-display mt-1 block text-6xl italic tracking-tight sm:text-8xl lg:text-9xl"
              style={{ color: 'var(--color-amber)' }}
            >
              that ship.
            </span>
          </h1>

          {/* Subhead */}
          <p
            className="animate-fade-in-up delay-300 mt-8 max-w-lg text-lg leading-relaxed sm:text-xl"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            react-spotlight is the modern React tour library. Zero dependencies, WCAG 2.1 AA
            accessible, under 5 kB gzipped. The one that works with React 19.
          </p>

          {/* CTA row */}
          <div className="animate-fade-in-up delay-400 mt-10 flex flex-wrap items-center gap-4">
            <TourTriggerButton
              className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                background: 'var(--color-amber)',
                color: 'var(--color-surface)',
              }}
            />
            <a
              href="https://github.com/bilaltahir/react-spotlight"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-medium transition-colors duration-200 hover:bg-white/5"
              style={{
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              GitHub
            </a>
          </div>

          {/* Interactive tour (no visible UI — listens for trigger events) */}
          <InteractiveTour />

          {/* Stats strip */}
          <div
            className="animate-fade-in-up delay-600 mt-16 flex flex-wrap gap-12 border-t pt-8"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            {[
              { value: '~5KB', label: 'gzipped' },
              { value: '0', label: 'dependencies' },
              { value: 'AA', label: 'WCAG 2.1' },
              { value: 'MIT', label: 'licensed' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span
                  className="font-display text-3xl tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {stat.value}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE PROBLEM ─── */}
      <AnimateOnScroll>
        <section
          className="relative px-6 py-24 sm:px-12 lg:px-24"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <span
                  className="font-mono text-xs font-medium uppercase tracking-widest"
                  style={{ color: 'var(--color-amber)' }}
                >
                  The Problem
                </span>
                <h2
                  className="font-display mt-4 text-4xl leading-tight tracking-tight sm:text-5xl"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Every tour library
                  <br />
                  <em style={{ color: 'var(--color-text-secondary)' }}>is broken.</em>
                </h2>
              </div>
              <div
                className="space-y-6 text-base leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <p>
                  React Joyride uses deprecated APIs that are{' '}
                  <strong style={{ color: 'var(--color-text-primary)' }}>
                    removed in React 19
                  </strong>
                  . Shepherd.js requires a paid commercial license. Intro.js is GPL. Driver.js has
                  no React bindings.
                </p>
                <p>
                  Every developer evaluating tour libraries in 2025 hits the same wall:{' '}
                  <strong style={{ color: 'var(--color-text-primary)' }}>
                    nothing modern, free, and React-native exists.
                  </strong>
                </p>
                <p style={{ color: 'var(--color-amber-light)' }}>react-spotlight fills that gap.</p>
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* ─── FEATURES ─── */}
      <section
        data-tour="features"
        className="px-6 py-24 sm:px-12 lg:px-24"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <div className="mx-auto max-w-6xl">
          <AnimateOnScroll>
            <span
              className="font-mono text-xs font-medium uppercase tracking-widest"
              style={{ color: 'var(--color-amber)' }}
            >
              Why react-spotlight
            </span>
            <h2
              className="font-display mt-4 max-w-xl text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Built different.
            </h2>
          </AnimateOnScroll>

          <div
            className="mt-16 grid gap-px overflow-hidden rounded-2xl sm:grid-cols-2"
            style={{ background: 'var(--color-border-subtle)' }}
          >
            {[
              {
                title: 'Beautiful by default',
                body: 'Smooth CSS clip-path spotlight transitions. Light, dark, and custom themes. GPU-accelerated animations that never break in dark mode.',
                detail: 'clip-path > mix-blend-mode',
              },
              {
                title: 'Fully accessible',
                body: 'WCAG 2.1 AA compliant out of the box. Focus trap, keyboard navigation, ARIA roles, and screen reader announcements.',
                detail: 'Focus trap + ARIA + inert',
              },
              {
                title: 'Under 5 kB',
                body: 'Zero runtime dependencies. Floating UI is optional. The core is smaller than most icon libraries.',
                detail: '~5 kB gzip / 0 deps',
              },
              {
                title: 'MIT licensed',
                body: 'Free for commercial use. No GPL restrictions, no paid tiers, no "enterprise" upsell. Open source forever.',
                detail: 'Free forever',
              },
            ].map((feature, i) => (
              <AnimateOnScroll key={feature.title} delay={i * 80}>
                <div
                  {...(i === 0 ? { 'data-tour': 'feature-card' } : {})}
                  className="group relative flex flex-col justify-between p-8 transition-colors duration-300 hover:brightness-125 sm:p-10"
                  style={{ background: 'var(--color-surface-raised)' }}
                >
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className="mt-3 text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {feature.body}
                    </p>
                  </div>
                  <div
                    className="font-mono mt-6 text-xs font-medium"
                    style={{ color: 'var(--color-amber)' }}
                  >
                    {feature.detail}
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INSTALL + CODE ─── */}
      <AnimateOnScroll>
        <section
          data-tour="install"
          className="px-6 py-24 sm:px-12 lg:px-24"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Install */}
              <div>
                <span
                  className="font-mono text-xs font-medium uppercase tracking-widest"
                  style={{ color: 'var(--color-amber)' }}
                >
                  Quick Start
                </span>
                <h2
                  className="font-display mt-4 text-4xl leading-tight tracking-tight sm:text-5xl"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  One command.
                </h2>
                <p
                  className="mt-4 text-base leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Install the package, wrap your app, define your steps. That's it. You're shipping
                  onboarding in under five minutes.
                </p>

                {/* Terminal block */}
                <div
                  data-tour="terminal"
                  className="mt-8 overflow-hidden rounded-xl"
                  style={{
                    border: '1px solid var(--color-border-subtle)',
                    background: 'var(--color-surface-raised)',
                  }}
                >
                  <div
                    className="font-mono flex items-center gap-2 px-4 py-2.5 text-xs"
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ef4444' }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#eab308' }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#22c55e' }} />
                    <span className="ml-2">terminal</span>
                  </div>
                  <pre
                    className="overflow-x-auto p-5 text-sm"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    <code>
                      <span style={{ color: 'var(--color-text-secondary)' }}>$ </span>
                      <span style={{ color: 'var(--color-text-primary)' }}>
                        npm install react-spotlight @floating-ui/react-dom
                      </span>
                    </code>
                  </pre>
                </div>
              </div>

              {/* Code example */}
              <div>
                <div
                  className="overflow-hidden rounded-xl"
                  style={{
                    border: '1px solid var(--color-border-subtle)',
                    background: 'var(--color-surface-raised)',
                  }}
                >
                  <div
                    className="font-mono flex items-center gap-2 px-4 py-2.5 text-xs"
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ef4444' }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#eab308' }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#22c55e' }} />
                    <span className="ml-2">App.tsx</span>
                  </div>
                  <pre
                    className="overflow-x-auto p-5 text-[13px] leading-relaxed"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    <code>
                      <span style={{ color: '#c084fc' }}>import</span>
                      {' { '}
                      <span style={{ color: 'var(--color-text-primary)' }}>SpotlightProvider</span>
                      {', '}
                      <span style={{ color: 'var(--color-text-primary)' }}>SpotlightTour</span>
                      {' }\n'}
                      <span style={{ color: '#c084fc' }}> from</span>{' '}
                      <span style={{ color: '#86efac' }}>{"'react-spotlight'"}</span>
                      {'\n'}
                      <span style={{ color: '#c084fc' }}>import</span>{' '}
                      <span style={{ color: '#86efac' }}>{"'react-spotlight/styles.css'"}</span>
                      {'\n\n'}
                      <span style={{ color: '#c084fc' }}>const</span>
                      <span style={{ color: 'var(--color-text-primary)' }}> steps</span>
                      {' = [\n'}
                      {'  { '}
                      <span style={{ color: '#93c5fd' }}>target</span>
                      {': '}
                      <span style={{ color: '#86efac' }}>{"'#welcome'"}</span>
                      {', '}
                      <span style={{ color: '#93c5fd' }}>title</span>
                      {': '}
                      <span style={{ color: '#86efac' }}>{"'Welcome'"}</span>
                      {' },\n'}
                      {'  { '}
                      <span style={{ color: '#93c5fd' }}>target</span>
                      {': '}
                      <span style={{ color: '#86efac' }}>{"'#features'"}</span>
                      {', '}
                      <span style={{ color: '#93c5fd' }}>title</span>
                      {': '}
                      <span style={{ color: '#86efac' }}>{"'Features'"}</span>
                      {' },\n]\n\n'}
                      <span style={{ color: '#c084fc' }}>function</span>{' '}
                      <span style={{ color: 'var(--color-amber-light)' }}>App</span>
                      {'() {\n  '}
                      <span style={{ color: '#c084fc' }}>return</span>
                      {' (\n    '}
                      <span style={{ color: '#93c5fd' }}>{'<SpotlightProvider>'}</span>
                      {'\n      '}
                      <span style={{ color: '#93c5fd' }}>{'<SpotlightTour'}</span>
                      {'\n        '}
                      <span style={{ color: '#93c5fd' }}>id</span>
                      {'='}
                      <span style={{ color: '#86efac' }}>{'"onboarding"'}</span>
                      {'\n        '}
                      <span style={{ color: '#93c5fd' }}>steps</span>
                      {'={steps}\n      '}
                      <span style={{ color: '#93c5fd' }}>{'/>'}</span>
                      {'\n      '}
                      <span style={{ color: '#93c5fd' }}>{'<YourApp />'}</span>
                      {'\n    '}
                      <span style={{ color: '#93c5fd' }}>{'</SpotlightProvider>'}</span>
                      {'\n  )\n}'}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* ─── COMPARISON ─── */}
      <AnimateOnScroll>
        <section
          data-tour="comparison"
          className="px-6 py-24 sm:px-12 lg:px-24"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <div className="mx-auto max-w-6xl">
            <span
              className="font-mono text-xs font-medium uppercase tracking-widest"
              style={{ color: 'var(--color-amber)' }}
            >
              Comparison
            </span>
            <h2
              className="font-display mt-4 text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ color: 'var(--color-text-primary)' }}
            >
              See the difference.
            </h2>

            <div
              className="mt-12 overflow-hidden rounded-xl"
              style={{
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <table data-tour="comparison-table" className="w-full text-left text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-surface-overlay)' }}>
                    <th
                      className="px-6 py-4 text-xs font-medium uppercase tracking-wider"
                      style={{
                        color: 'var(--color-text-secondary)',
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      Feature
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-medium uppercase tracking-wider"
                      style={{
                        color: 'var(--color-amber)',
                        borderBottom: '1px solid var(--color-border-accent)',
                      }}
                    >
                      react-spotlight
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-medium uppercase tracking-wider"
                      style={{
                        color: 'var(--color-text-secondary)',
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      Others
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['React 19', 'Fully compatible', 'Broken / wrappers'],
                    ['Bundle size', '< 5 kB', '15–50 kB'],
                    ['Dependencies', '0', '5–15+'],
                    ['Accessibility', 'WCAG 2.1 AA', 'Partial at best'],
                    ['Focus trap', 'Built-in', 'Not available'],
                    ['Dark mode', 'CSS clip-path', 'mix-blend-mode (breaks)'],
                    ['License', 'MIT', 'GPL / Paid / MIT'],
                  ].map(([feature, ours, theirs], i) => (
                    <tr
                      key={feature}
                      style={{
                        background:
                          i % 2 === 0 ? 'var(--color-surface-raised)' : 'var(--color-surface)',
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <td
                        className="px-6 py-4 font-medium"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {feature}
                      </td>
                      <td className="px-6 py-4" style={{ color: 'var(--color-amber-light)' }}>
                        {ours}
                      </td>
                      <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>
                        {theirs}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* ─── CTA ─── */}
      <AnimateOnScroll>
        <section
          className="px-6 py-32 sm:px-12 lg:px-24"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="font-display text-5xl leading-tight tracking-tight sm:text-6xl lg:text-7xl"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Ship onboarding
              <br />
              <em style={{ color: 'var(--color-amber)' }}>that converts.</em>
            </h2>
            <p
              className="mx-auto mt-6 max-w-md text-lg leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Five minutes to integrate. Beautiful by default. The tour library React has been
              waiting for.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-sm font-semibold transition-all duration-200 hover:brightness-110"
                style={{
                  background: 'var(--color-amber)',
                  color: 'var(--color-surface)',
                }}
              >
                Read the Docs
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <code
                className="font-mono rounded-lg px-5 py-4 text-sm"
                style={{
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-surface-raised)',
                }}
              >
                npm install react-spotlight
              </code>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* ─── FOOTER ─── */}
      <footer
        className="px-6 py-8 text-center text-sm sm:px-12"
        style={{
          borderTop: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <p>
          MIT License &middot;{' '}
          <a
            href="https://github.com/bilaltahir/react-spotlight"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-white"
          >
            GitHub
          </a>{' '}
          &middot; Built with{' '}
          <a
            href="https://fumadocs.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-white"
          >
            Fumadocs
          </a>
        </p>
      </footer>
    </main>
  )
}

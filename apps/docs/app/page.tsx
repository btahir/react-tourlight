import Link from 'next/link'
import { InteractiveTour } from '@/components/demo/interactive-tour'

const features = [
  {
    title: 'Beautiful',
    description:
      'Smooth CSS clip-path animations with customizable themes. Light and dark mode out of the box.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  },
  {
    title: 'Accessible',
    description:
      'Full keyboard navigation, focus trapping, screen reader announcements, and ARIA attributes built in.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="16" cy="4" r="1" />
        <path d="m18 19 1-7-6 1" />
        <path d="m5 8 3-3 5.5 3-2.36 3.5" />
        <path d="m4.24 14.5 5-6.5" />
        <path d="m9 19 2-8" />
      </svg>
    ),
  },
  {
    title: 'Tiny',
    description:
      'Zero runtime dependencies. The core library is under 5 kB gzipped. Only pay for what you use.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
        <line x1="16" x2="2" y1="8" y2="22" />
        <line x1="17.5" x2="9" y1="15" y2="15" />
      </svg>
    ),
  },
  {
    title: 'MIT License',
    description:
      'Free and open-source forever. Use it in personal and commercial projects without restrictions.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
]

const installCommand = 'npm install react-spotlight @floating-ui/react-dom'

const codeExample = `import { SpotlightProvider, SpotlightTour, useSpotlight } from 'react-spotlight'
import 'react-spotlight/styles.css'

const steps = [
  { target: '#step-1', title: 'Welcome!', content: 'Let us show you around.' },
  { target: '#step-2', title: 'Features', content: 'Check out what we offer.' },
]

function App() {
  return (
    <SpotlightProvider>
      <SpotlightTour id="onboarding" steps={steps} />
      <YourApp />
    </SpotlightProvider>
  )
}`

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section
        data-tour="hero"
        className="relative flex flex-col items-center justify-center gap-6 px-6 pb-20 pt-32 text-center"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent" />
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight sm:text-7xl">
          react-spotlight
        </h1>
        <p className="max-w-xl text-lg text-fd-muted-foreground sm:text-xl">
          Beautiful onboarding tours &amp; feature highlights for React. Zero
          dependencies, fully accessible, tiny bundle.
        </p>
        <div className="flex gap-4">
          <Link
            href="/docs"
            className="inline-flex items-center rounded-lg bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            Get Started
          </Link>
          <a
            href="https://github.com/bilaltahir/react-spotlight"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-fd-border bg-fd-background px-6 py-3 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            GitHub
          </a>
        </div>
        <div className="mt-4">
          <InteractiveTour />
        </div>
      </section>

      {/* Features */}
      <section
        data-tour="features"
        className="mx-auto grid w-full max-w-5xl gap-6 px-6 pb-20 sm:grid-cols-2"
      >
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-fd-border bg-fd-card p-6 transition-colors hover:border-fd-primary/40"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
              {feature.icon}
            </div>
            <h3 className="mb-1 text-lg font-semibold">{feature.title}</h3>
            <p className="text-sm text-fd-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      {/* Install */}
      <section
        data-tour="install"
        className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 pb-20"
      >
        <h2 className="text-3xl font-bold tracking-tight">Get started in seconds</h2>
        <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-fd-border bg-fd-card">
          <div className="flex items-center gap-2 border-b border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <span className="h-3 w-3 rounded-full bg-green-500/60" />
            <span className="ml-2">Terminal</span>
          </div>
          <pre className="overflow-x-auto p-4 text-sm">
            <code>
              <span className="text-fd-muted-foreground">$ </span>
              {installCommand}
            </code>
          </pre>
        </div>
      </section>

      {/* Code Example */}
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 pb-20">
        <h2 className="text-3xl font-bold tracking-tight">Simple, declarative API</h2>
        <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-fd-border bg-fd-card">
          <div className="flex items-center gap-2 border-b border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <span className="h-3 w-3 rounded-full bg-green-500/60" />
            <span className="ml-2">App.tsx</span>
          </div>
          <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
            <code>{codeExample}</code>
          </pre>
        </div>
      </section>

      {/* Comparison */}
      <section
        data-tour="comparison"
        className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 pb-24"
      >
        <h2 className="text-3xl font-bold tracking-tight">
          Why react-spotlight?
        </h2>
        <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-fd-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-fd-border bg-fd-card">
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 font-medium text-fd-primary">
                  react-spotlight
                </th>
                <th className="px-4 py-3 font-medium text-fd-muted-foreground">
                  Others
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fd-border">
              <tr>
                <td className="px-4 py-3">Bundle size</td>
                <td className="px-4 py-3 text-fd-primary">&lt; 5 kB</td>
                <td className="px-4 py-3 text-fd-muted-foreground">15–50 kB</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Dependencies</td>
                <td className="px-4 py-3 text-fd-primary">0</td>
                <td className="px-4 py-3 text-fd-muted-foreground">5–15+</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Accessibility</td>
                <td className="px-4 py-3 text-fd-primary">Full ARIA + keyboard</td>
                <td className="px-4 py-3 text-fd-muted-foreground">Partial</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Animation</td>
                <td className="px-4 py-3 text-fd-primary">CSS clip-path (GPU)</td>
                <td className="px-4 py-3 text-fd-muted-foreground">mix-blend-mode / DOM</td>
              </tr>
              <tr>
                <td className="px-4 py-3">React 19</td>
                <td className="px-4 py-3 text-fd-primary">Fully compatible</td>
                <td className="px-4 py-3 text-fd-muted-foreground">Broken / wrappers</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-fd-border py-8 text-center text-sm text-fd-muted-foreground">
        <p>
          MIT License &middot; Built with{' '}
          <a
            href="https://fumadocs.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-fd-foreground"
          >
            Fumadocs
          </a>
        </p>
      </footer>
    </main>
  )
}

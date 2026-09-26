import Link from 'next/link'
import { GuidePlayground } from '@/components/landing/guide-playground'

const repository = 'https://github.com/btahir/react-tourlight'

function Arrow() {
  return <span aria-hidden="true">↗</span>
}

export default function HomePage() {
  return (
    <main className="tl-site">
      <a className="tl-skip" href="#main-content">
        Skip to content
      </a>
      <header className="tl-nav tl-container">
        <Link className="tl-brand" href="/" aria-label="React Tourlight home">
          <span className="tl-brand-mark" aria-hidden="true">
            t
          </span>
          <span>
            tourlight<span className="tl-brand-react">for React</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/docs">Documentation</Link>
          <Link href="/support">Support</Link>
          <a className="tl-nav-github" href={repository}>
            GitHub <Arrow />
          </a>
          <Link className="tl-button tl-button-small" href="/studio">
            Open Studio <Arrow />
          </Link>
        </nav>
      </header>

      <section className="tl-hero tl-container" id="main-content">
        <div className="tl-eyebrow">
          <span className="tl-status-dot" /> THE OPEN-SOURCE GUIDE STUDIO
        </div>
        <div className="tl-hero-heading">
          <h1>
            A little guidance.
            <br />
            <em>A lot of possibility.</em>
          </h1>
          <div className="tl-hero-aside">
            <p>
              Make your product easier to find your way around. Build beautiful React tours with
              your team, your code, and your favorite agent.
            </p>
            <Link className="tl-button" href="/studio">
              Make your first guide <Arrow />
            </Link>
            <span className="tl-small-note">Free to build. Yours to keep. MIT licensed.</span>
          </div>
        </div>
        <GuidePlayground />
        <div className="tl-proof-strip" aria-label="Package capabilities">
          <span>React 18 + 19</span>
          <span>Visual editor included</span>
          <span>Local drafts · JSON export</span>
          <span>Headless when you want it</span>
        </div>
      </section>

      <section className="tl-section tl-container" id="workflow">
        <div className="tl-section-heading">
          <span className="tl-eyebrow">01 / ONE SHARED LANGUAGE</span>
          <h2>
            Great guides happen
            <br />
            <em>between disciplines.</em>
          </h2>
          <p>
            Product knows the journey. Engineering knows the application. Your agent helps connect
            the dots. Everyone works on the same guide document.
          </p>
        </div>
        <div className="tl-workflow">
          <article>
            <span className="tl-workflow-number">01</span>
            <span className="tl-role">FOR PRODUCT PEOPLE</span>
            <h3>See it. Shape it.</h3>
            <p>
              Pick an element in your app, give it a little context, and preview the journey. Edit
              the words and order without rewriting the integration.
            </p>
            <Link href="/docs/studio">
              Meet the editor <Arrow />
            </Link>
          </article>
          <article>
            <span className="tl-workflow-number">02</span>
            <span className="tl-role">FOR DEVELOPERS</span>
            <h3>Your app. Your rules.</h3>
            <p>
              Keep guides beside your code. Bring your own components, routes, and application
              logic. Import the editor only where you need it.
            </p>
            <Link href="/docs/documents">
              Explore tour documents <Arrow />
            </Link>
          </article>
          <article>
            <span className="tl-workflow-number">03</span>
            <span className="tl-role">FOR YOUR AGENT</span>
            <h3>Make the handoff tiny.</h3>
            <p>
              Give your agent a schema, a skill, and useful validation errors. Draft a guide, review
              it visually, and keep iterating together.
            </p>
            <Link href="/docs/agents">
              Build with an agent <Arrow />
            </Link>
          </article>
        </div>
        <div className="tl-artifact-line">
          <span>Visual editor</span>
          <span aria-hidden="true">↔</span>
          <code>tour.json</code>
          <span aria-hidden="true">↔</span>
          <span>Your code &amp; agents</span>
        </div>
      </section>

      <section className="tl-capabilities">
        <div className="tl-container tl-capabilities-inner">
          <div className="tl-capabilities-intro">
            <span className="tl-eyebrow">02 / SMALL DETAILS. REAL DIFFERENCE.</span>
            <h2>
              Made for the
              <br />
              <em>actual application.</em>
            </h2>
            <p>
              A guide should work where your users work: through navigation, late-loading elements,
              and the moment they click the real button.
            </p>
            <Link className="tl-text-link" href="/docs">
              See what’s inside <Arrow />
            </Link>
            <div className="tl-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
              <i>t</i>
            </div>
          </div>
          <div className="tl-feature-list">
            <article>
              <span>01</span>
              <div>
                <h3>Let people do the thing.</h3>
                <p>
                  Interactive steps let users click, type, and learn in your real UI. Advance on an
                  event, or connect the guide to your application logic.
                </p>
                <Link href="/docs/interactive">
                  Interactive steps <Arrow />
                </Link>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Follow the whole journey.</h3>
                <p>
                  Continue across routes. Wait for an element to be ready. Persist progress and give
                  people a way back into the guide.
                </p>
                <Link href="/docs/multi-page">
                  Multi-page tours <Arrow />
                </Link>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Look like you belong.</h3>
                <p>
                  Start with the included tooltip, adapt the theme, or bring your design system with
                  custom rendering and the headless core.
                </p>
                <Link href="/docs/customization">
                  Make it yours <Arrow />
                </Link>
              </div>
            </article>
            <article>
              <span>04</span>
              <div>
                <h3>Check before you ship.</h3>
                <p>
                  Validate guide documents and inspect targets. Add real browser checks for the
                  routes, roles, and states your users encounter.
                </p>
                <Link href="/docs/testing">
                  Testing &amp; diagnostics <Arrow />
                </Link>
              </div>
            </article>
            <article>
              <span>05</span>
              <div>
                <h3>Help people find their own way.</h3>
                <p>
                  Offer an onboarding checklist and a searchable guide library. Let people choose
                  what helps, and keep task completion connected to your app.
                </p>
                <Link href="/guidance">
                  Try the companion components <Arrow />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="tl-section tl-container tl-start-section" id="start">
        <div>
          <span className="tl-eyebrow">03 / TAKE IT WITH YOU</span>
          <h2>
            A package.
            <br />
            An editor.
            <br />
            <em>Entirely yours.</em>
          </h2>
          <p>
            Use the React API directly, or add Studio to an app you control. Save the document,
            review it in Git, and serve it from your own infrastructure.
          </p>
          <div className="tl-start-links">
            <Link className="tl-button" href="/docs">
              Start building <Arrow />
            </Link>
            <Link className="tl-text-link" href="/docs/studio">
              How Studio fits in <Arrow />
            </Link>
          </div>
        </div>
        <div className="tl-code-window">
          <div className="tl-code-title">
            <span className="tl-status-dot" /> YOUR TERMINAL
          </div>
          <pre>
            <code>
              <span className="tl-code-muted">$ </span>npm install react-tourlight {'\\'}{'\n'}{' '}
              @floating-ui/react-dom
            </code>
          </pre>
          <div className="tl-code-title tl-code-divider">YOUR APP.TSX</div>
          <pre>
            <code>
              <span className="tl-code-muted">// The code-first path is always here.</span>
              {'\n'}
              <span className="tl-code-keyword">import</span>{' '}
              {'{ SpotlightProvider,\n  SpotlightTour, useSpotlight }'}
              {'\n'} <span className="tl-code-keyword">from</span>{' '}
              <span className="tl-code-string">'react-tourlight'</span>
              {'\n\n'}
              <span className="tl-code-keyword">import</span>{' '}
              <span className="tl-code-string">'react-tourlight/styles.css'</span>
              {'\n\n'}
              {
                '<SpotlightProvider>\n  <SpotlightTour\n    id="welcome"\n    steps={yourSteps}\n  />\n  <YourApp />\n</SpotlightProvider>'
              }
            </code>
          </pre>
          <div className="tl-code-foot">
            Call <code>useSpotlight().start('welcome')</code> from your app.
          </div>
        </div>
      </section>

      <section className="tl-faq tl-container" aria-labelledby="faq-title">
        <div>
          <span className="tl-eyebrow">A FEW GOOD QUESTIONS</span>
          <h2 id="faq-title">
            Before you
            <br />
            <em>jump in.</em>
          </h2>
        </div>
        <div className="tl-faq-list">
          <details>
            <summary>Is the visual editor really free?</summary>
            <p>
              Yes. Studio and the library are part of the MIT-licensed project. There is no
              Tourlight account or usage-based bill required to create and run your guides.
            </p>
          </details>
          <details>
            <summary>Does a product person need to write code?</summary>
            <p>
              A developer integrates Tourlight and makes Studio available in the application. After
              that, product teammates can edit supported guide content visually and export a
              document. Application-specific behavior still belongs to your application.
            </p>
          </details>
          <details>
            <summary>Can I use it with my coding agent?</summary>
            <p>
              Yes. The document schema, CLI, and skill give agents a concrete format to work with.
              You can inspect their output in Studio and validate it before integration. See the{' '}
              <Link href="/docs/agents">agent guide</Link> for setup and client-specific boundaries.
            </p>
          </details>
          <details>
            <summary>Can Studio edit any website from a URL?</summary>
            <p>
              The live element picker works in an application where Studio is integrated. The
              standalone playground demonstrates the workflow; it does not bypass browser security
              or inspect unrelated websites.
            </p>
          </details>
          <details>
            <summary>Do I have to use Studio?</summary>
            <p>
              No. Keep using React components, refs, custom content, and lifecycle hooks directly.
              Documents and Studio are an additional way to author guides. The headless entry is
              available when you want to build your own UI.
            </p>
          </details>
        </div>
      </section>

      <section className="tl-closing tl-container">
        <span className="tl-eyebrow">A BETTER WAY TO SHOW THE WAY</span>
        <h2>
          Let’s make
          <br />
          <em>something clear.</em>
        </h2>
        <Link className="tl-button" href="/studio">
          Open Tourlight Studio <Arrow />
        </Link>
        <p>No account. No credit card. Just a guide waiting to happen.</p>
      </section>
      <aside className="tl-support-callout tl-container" aria-label="Support this project">
        <div>
          <h2>Help keep Tourlight free.</h2>
          <p>Support the maintainer behind Tourlight, Kino, Clickmap, and Redact. Give once or sponsor monthly.</p>
        </div>
        <Link className="tl-button tl-button-small" href="/support">Support this project ↗</Link>
      </aside>
      <footer className="tl-footer tl-container">
        <Link className="tl-brand" href="/">
          tourlight<span className="tl-brand-react">for React</span>
        </Link>
        <p>Open source. Built with care. MIT licensed.</p>
        <nav aria-label="Footer navigation">
          <a href={repository}>
            Source <Arrow />
          </a>
          <Link href="/docs">Docs</Link>
          <Link href="/support">Support</Link>
          <a href={`${repository}/issues`}>
            Feedback <Arrow />
          </a>
        </nav>
      </footer>
    </main>
  )
}

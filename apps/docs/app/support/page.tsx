import type { Metadata } from 'next'
import Link from 'next/link'
import { support } from '@/lib/support'
import styles from './support.module.css'

export const metadata: Metadata = {
  title: 'React Maintainer Support',
  description:
    'Support development, documentation, and maintenance of Tourlight, Kino, Clickmap, and Redact. Give once or contribute monthly.',
  alternates: { canonical: '/support' },
}

export default function SupportPage() {
  return (
    <main className={`tl-site ${styles.page}`}>
      <a className="tl-skip" href="#support-options">Skip to support options</a>
      <header className="tl-nav tl-container">
        <Link className="tl-brand" href="/" aria-label="React Tourlight home">
          tourlight<span className="tl-brand-react">for React</span>
        </Link>
        <nav aria-label="Support navigation">
          <Link href="/docs">Documentation</Link>
          <Link className="tl-button tl-button-small" href="/studio">Open Studio ↗</Link>
        </nav>
      </header>

      <section className={`tl-container ${styles.intro}`}>
        <span className="tl-eyebrow">FREE SOFTWARE / SHARED SUPPORT</span>
        <h1>A little support.<br /><em>More possibility.</em></h1>
        <p>
          Support the maintainer behind Tourlight, Kino, Clickmap, and Redact. Your contribution
          funds development, documentation, and maintenance across all four projects.
        </p>
        <p className={styles.promise}>All four projects stay free and open source under MIT.</p>
      </section>

      <section className={`tl-container ${styles.options}`} id="support-options" aria-label="Support options">
        <div className={styles.once}>
          <div>
            <span className="tl-eyebrow">ONE-TIME SUPPORT</span>
            <h2>Say thanks, your way.</h2>
            <p>Choose any amount at checkout. We suggest $20. One payment, no subscription.</p>
          </div>
          <a className="tl-button" href={support.once}>Give once ↗</a>
        </div>

        <div className={styles.monthlyHeading}>
          <h2>Keep it going.</h2>
          <p>Monthly support, in USD. Cancel renewal at any time.</p>
        </div>
        <div className={styles.tiers}>
          {support.monthly.map((tier) => (
            <article className={styles.tier} key={tier.amount}>
              <h3>{tier.name}</h3>
              <p className={styles.price}>${tier.amount}<span> / month</span></p>
              <a className="tl-button tl-button-small" href={tier.url}>
                Support ${tier.amount}/month ↗
              </a>
            </article>
          ))}
        </div>
        <p className={styles.terms}>
          Every tier supports the same open-source maintenance work. Sponsorship is voluntary and
          includes no exclusive features or dedicated support. Monthly contributions renew automatically
          until canceled; cancellation takes effect at the end of the billing period.
        </p>
        <p className={styles.notice}>
          Payments are processed securely by Stripe through our existing <strong>GPT Hotline</strong>{' '}
          account. You’ll see that name and logo at checkout alongside your maintainer contribution.
        </p>
      </section>

      <section className={`tl-container ${styles.manage}`} aria-labelledby="manage-heading">
        <div>
          <h2 id="manage-heading">Already supporting?</h2>
          <p>Update your card, view invoices, or cancel your monthly sponsorship.</p>
        </div>
        <a className="tl-text-link" href={support.portal}>Manage sponsorship ↗</a>
      </section>
      <footer className={`tl-container ${styles.footer}`}>
        <p>Code, bug reports, documentation, and sharing the project help too.</p>
        <a className="tl-text-link" href="https://github.com/btahir/react-tourlight">
          Contribute on GitHub ↗
        </a>
      </footer>
    </main>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { StudioDemo } from '@/components/studio/studio-demo'
import 'react-tourlight/studio.css'
import 'react-tourlight/styles.css'
import './studio-demo.css'

export const metadata: Metadata = {
  title: 'Studio — visual tour authoring',
  description: 'Create, preview, validate, and export product tours. A free visual editor for developers, product people, and agents. Your guides stay yours.',
}

export default function StudioPage() {
  return <main className="studio-page">
    <nav className="studio-nav" aria-label="Studio navigation"><Link href="/">← tourlight</Link><span>A working playground. Your changes stay in this browser.</span><Link href="/docs/studio">Integration guide ↗</Link></nav>
    <div className="studio-intro"><div><p>THE SHORTEST DISTANCE FROM IDEA TO GUIDANCE</p><h1>Make yourself <em>clear.</em></h1></div><p>Pick an element. Find the words.<br />Give someone their next good step.</p></div>
    <StudioDemo />
    <footer className="studio-page-footer"><span>Free, open source, and yours to host.</span><Link href="/support">Support this project ↗</Link><span>Real React player · Portable JSON · No account</span></footer>
  </main>
}

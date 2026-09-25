import './global.css'
import { RootProvider } from 'fumadocs-ui/provider'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  metadataBase: new URL('https://react-tourlight.vercel.app'),
  title: {
    default: 'Tourlight — Guides for people. Tools for builders.',
    template: '%s | react-tourlight',
  },
  description:
    'Create React product guides with a free visual editor, portable documents, and agent tooling. Local drafts, interactive tours, headless core. MIT licensed.',
  keywords: [
    'react',
    'spotlight',
    'tour',
    'onboarding',
    'product-tour',
    'walkthrough',
    'tooltip',
    'highlight',
    'react 19',
    'accessible',
    'react joyride alternative',
    'headless',
    'beacon',
  ],
  authors: [{ name: 'Bilal Tahir', url: 'https://github.com/bilaltahir' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://react-tourlight.vercel.app',
    siteName: 'react-tourlight',
    title: 'Tourlight — Guides for people. Tools for builders.',
    description:
      'A free visual studio and React library for guides your team, code, and agents can build together. MIT licensed.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tourlight — Guides for people. Tools for builders.',
    description:
      'A free visual studio and React library for guides your team, code, and agents can build together. MIT licensed.',
    images: ['/og.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <RootProvider
          theme={{
            defaultTheme: 'light',
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  )
}

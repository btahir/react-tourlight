import './global.css'
import { RootProvider } from 'fumadocs-ui/provider'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  metadataBase: new URL('https://react-tourlight.vercel.app'),
  title: {
    default: 'react-tourlight — Beautiful onboarding tours for React',
    template: '%s | react-tourlight',
  },
  description:
    'Beautiful onboarding tours & feature highlights for React. Zero dependencies, fully accessible, ~5KB gzipped. MIT licensed.',
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
  ],
  authors: [{ name: 'Bilal Tahir', url: 'https://github.com/bilaltahir' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://react-tourlight.vercel.app',
    siteName: 'react-tourlight',
    title: 'react-tourlight — Beautiful onboarding tours for React',
    description:
      'Zero dependencies, fully accessible, ~5KB gzipped. The modern alternative to React Joyride.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'react-tourlight — Beautiful onboarding tours for React',
    description:
      'Zero dependencies, fully accessible, ~5KB gzipped. The modern alternative to React Joyride.',
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
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ colorScheme: 'dark' }}>
        <RootProvider
          theme={{
            defaultTheme: 'dark',
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  )
}

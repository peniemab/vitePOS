import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/Providers'
import { AuthGate } from '@/components/AuthGate'
import './globals.css'

export const metadata: Metadata = {
  title: 'vitePOS',
  description:
    'vitePOS — caisse rapide, stock et inventaire offline pour boutiques de quartier',
  applicationName: 'vitePOS',
  appleWebApp: {
    capable: true,
    title: 'vitePOS',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#031636',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-background text-on-background antialiased">
        <Providers>
          <AuthGate>{children}</AuthGate>
        </Providers>
      </body>
    </html>
  )
}

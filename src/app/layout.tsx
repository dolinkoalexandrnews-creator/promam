import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PROMAM — мами поруч',
  description:
    'Мапа мам навколо тебе, які готові зустрітися: на каву, на прогулянку з візочком, на майданчику — або просто познайомитися з сусідкою з твого під’їзду.',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'PROMAM — мами поруч',
    description: 'Знайди маму поруч: кава, прогулянка, майданчик, сусідки.',
    type: 'website',
    locale: 'uk_UA',
  },
}

export const viewport: Viewport = {
  themeColor: '#fdf8f4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

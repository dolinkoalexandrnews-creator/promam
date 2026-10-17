import type { NextConfig } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined

/**
 * Політика вмісту.
 *
 * 'unsafe-inline' для стилів потрібен Leaflet (він ставить позиції міток
 * інлайновим style), а для скриптів — завантажувачу Next.js. Перехід на
 * nonce зробимо, коли з'явиться потреба: це вимагає віддавати кожну
 * сторінку динамічно.
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://lh3.googleusercontent.com${
    supabaseUrl ? ` ${supabaseUrl}` : ''
  }`,
  `connect-src 'self' https://*.basemaps.cartocdn.com${
    supabaseUrl ? ` ${supabaseUrl} ${supabaseUrl.replace('https://', 'wss://')}` : ''
  }`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
].join('; ')

const config: NextConfig = {
  poweredByHeader: false,

  images: {
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: 'https' as const, hostname: supabaseHost }] : []),
      { protocol: 'https' as const, hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https' as const, hostname: 't.me' },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            // Геолокація потрібна самому сайту, решта — нікому.
            value: 'geolocation=(self), camera=(self), microphone=(), payment=(), usb=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default config

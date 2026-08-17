import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // En local, l’API Express reste sur 3789 jusqu’au portage des Route Handlers (ticket D).
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return []
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3789/api/:path*',
      },
    ]
  },
}

export default nextConfig

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig

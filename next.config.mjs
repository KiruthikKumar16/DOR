/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['generativelanguage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
      bodySizeLimit: '2mb'
    },
  },
}

export default nextConfig

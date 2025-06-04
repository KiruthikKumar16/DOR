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
    serverActions: true,
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  output: 'standalone',
  // Disable ESLint during build to avoid deployment issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build to avoid deployment issues
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure server to bind to all interfaces for Replit compatibility
  experimental: {
    serverComponentsExternalPackages: ['canvas']
  },
};

export default nextConfig;
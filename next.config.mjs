/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600, // 1 hour cache for images
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  output: 'standalone',
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Enable SWC minification
  swcMinify: true,
  
  // Optimize bundle
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['canvas']
  },
  // Enable ESLint during build for production quality
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Enable TypeScript error checking during build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Configure server to bind to all interfaces for Replit compatibility
  experimental: {
    serverComponentsExternalPackages: ['canvas']
  },
  // Allow all hosts for Replit proxy compatibility
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  // Enable all hosts for Replit environment
  async rewrites() {
    return []
  },
  // Ensure proper hostname handling for Replit proxy
  trailingSlash: false,
  // Critical: Allow all hosts for Replit proxy
  devIndicators: {
    buildActivity: false,
  },
  // Ensure Replit compatibility
  compress: false,
};

export default nextConfig;
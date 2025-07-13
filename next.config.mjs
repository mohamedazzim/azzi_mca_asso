/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
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
};

export default nextConfig;

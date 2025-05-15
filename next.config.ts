import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false, // Set to false for production readiness
  },
  eslint: {
    ignoreDuringBuilds: false, // Set to false for production readiness
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // Added for placeholder images
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;

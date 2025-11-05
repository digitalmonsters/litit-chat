import type { NextConfig } from "next";
// @ts-expect-error - next-pwa doesn't have TypeScript definitions
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: 'bunnycdn.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  // Turbopack configuration
  turbopack: {},
  // Webpack fallback for PWA (only used if Turbopack disabled)
  webpack: (config: unknown, { isServer }: { isServer: boolean }) => {
    const webpackConfig = config as {
      resolve: { fallback?: Record<string, boolean> };
    };
    if (!isServer && webpackConfig.resolve) {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
      };
    }
    return webpackConfig;
  },
};

export default withPWA(nextConfig);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        hostname: "masteji-mordern-lms.t3.storageapi.dev",
        protocol: "https",
      },
    ],
    dangerouslyAllowSVG: true,
  },

  // Minimal webpack configuration
  webpack: (config, { isServer }) => {
    // Only add Prisma plugin for server-side builds
    if (isServer) {
      try {
        const { PrismaPlugin } = require('experimental-prisma-webpack-plugin');
        config.plugins = [...config.plugins, new PrismaPlugin()];
      } catch (error) {
        console.log('⚠️  Prisma plugin not available, skipping...');
      }
    }

    // Minimal watch options - only ignore essential directories
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/Application Data/**',
        '**/AppData/**',
        '**/Local Settings/**',
        '**/Cookies/**',
        '**/History/**',
        '**/Temporary Internet Files/**',
        '**/Windows/**',
        '**/System32/**',
        '**/Program Files/**',
        '**/Program Files (x86)/**',
        '**/ProgramData/**',
        '**/Users/ABC/**',
        '**/Users/**',
        '**/C:/Users/**',
        '**/C:/Windows/**',
        '**/C:/Program Files/**',
        '**/C:/ProgramData/**'
      ]
    };

    return config;
  },

  // Basic configuration
  reactStrictMode: true,
  
  // Build optimizations
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Server external packages
  serverExternalPackages: ['@react-email/render', '@react-email/components', 'resend'],

  // Output configuration
  output: 'standalone',
};

export default nextConfig;
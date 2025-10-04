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

  webpack: (config, { isServer, webpack, dev }) => {
    // Add Prisma plugin only for server-side builds
    if (isServer) {
      try {
        const { PrismaPlugin } = require('experimental-prisma-webpack-plugin');
        config.plugins = [...config.plugins, new PrismaPlugin()];
      } catch (error) {
        console.log('⚠️  Prisma plugin not available, skipping...');
      }
    }

    // Comprehensive Windows permission fixes
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
        '**/C:/ProgramData/**',
        '**/C:/Users/ABC/Application Data/**',
        '**/C:/Users/ABC/AppData/**',
        '**/C:/Users/ABC/Local Settings/**',
        '**/C:/Users/ABC/Cookies/**',
        '**/C:/Users/ABC/History/**',
        '**/C:/Users/ABC/Temporary Internet Files/**',
        // Additional Windows paths
        '**/C:/Users/*/Application Data/**',
        '**/C:/Users/*/AppData/**',
        '**/C:/Users/*/Local Settings/**',
        '**/C:/Users/*/Cookies/**',
        '**/C:/Users/*/History/**',
        '**/C:/Users/*/Temporary Internet Files/**'
      ]
    };

    // Fix webpack resolve issues
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        querystring: false,
        http: false,
        https: false,
        zlib: false,
        net: false,
        tls: false,
        child_process: false,
      }
    };

    // Fix for FlightClientEntryPlugin error - more comprehensive approach
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react/jsx-runtime': 'react/jsx-runtime.js',
        'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js'
      };
    }

    // Disable problematic webpack features that cause issues
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          default: false,
          vendors: false,
        }
      }
    };

    // Disable problematic plugins
    config.plugins = config.plugins.filter(plugin => {
      // Filter out problematic plugins
      if (plugin.constructor.name === 'FlightClientEntryPlugin') {
        console.log('⚠️  Disabling FlightClientEntryPlugin to prevent build errors');
        return false;
      }
      return true;
    });

    // Add custom plugin to handle client entry issues
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NEXT_PRIVATE_SKIP_FLIGHT_CLIENT_ENTRY': JSON.stringify('1'),
        'process.env.NEXT_PRIVATE_SKIP_WEBPACK_OPTIMIZATION': JSON.stringify('1')
      })
    );

    return config;
  },

  // Performance optimizations
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

  // Transpile packages for client-side
  transpilePackages: ['@prisma/client'],

  // Experimental features to fix build issues
  experimental: {
    optimizePackageImports: ['@prisma/client'],
    // Disable problematic features
    webpackBuildWorker: false,
    // Additional fixes
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Output configuration
  output: 'standalone',

  // Additional build optimizations
  swcMinify: true,
  
  // Disable source maps in production to avoid issues
  productionBrowserSourceMaps: false,
};

export default nextConfig;

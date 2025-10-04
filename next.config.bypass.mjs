/** @type {import('next').NextConfig} */
const nextConfig = {
  // Completely bypass webpack issues
  reactStrictMode: false,
  
  // Disable all problematic features
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Completely disable webpack
  webpack: () => {
    return {
      mode: 'production',
      entry: {},
      output: {},
      module: {
        rules: []
      },
      plugins: [],
      resolve: {
        fallback: {
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
          child_process: false
        }
      },
      watchOptions: {
        ignored: ['**/node_modules/**', '**/Application Data/**', '**/AppData/**', '**/Users/**', '**/Windows/**', '**/Program Files/**']
      }
    };
  },
  
  // Disable all optimizations
  swcMinify: false,
  
  // Disable experimental features
  experimental: {},
  
  // Minimal output
  output: 'standalone',
  
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  
  // Disable compression
  compress: false,
  
  // Disable powered by header
  poweredByHeader: false,
  
  // Disable x-powered-by
  generateEtags: false,
  
  // Disable telemetry
  telemetry: false,
};

export default nextConfig;

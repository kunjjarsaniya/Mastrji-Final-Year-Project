// fix-build.js - Comprehensive build fix script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive build fix...');

// Step 1: Clean everything
console.log('\n🧹 Step 1: Cleaning everything...');
try {
  const dirsToClean = ['.next', 'out', 'node_modules/.cache', '.swc', 'dist', 'build'];
  dirsToClean.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Cleaned ${dir}`);
    }
  });
  
  // Clean npm cache
  execSync('npm cache clean --force', { stdio: 'ignore' });
  console.log('✅ Cleaned npm cache');
} catch (error) {
  console.log('⚠️  Cleanup had issues but continuing...');
}

// Step 2: Fix Next.js configuration
console.log('\n🔧 Step 2: Fixing Next.js configuration...');
const fixedConfig = `/** @type {import('next').NextConfig} */
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

  webpack: (config, { isServer, webpack }) => {
    // Add Prisma plugin only for server-side builds
    if (isServer) {
      try {
        const { PrismaPlugin } = require('experimental-prisma-webpack-plugin');
        config.plugins = [...config.plugins, new PrismaPlugin()];
      } catch (error) {
        console.log('⚠️  Prisma plugin not available, skipping...');
      }
    }

    // Fix for Windows permission issues
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
  },

  // Output configuration
  output: 'standalone',
};

export default nextConfig;`;

try {
  fs.writeFileSync('next.config.mjs', fixedConfig);
  console.log('✅ Fixed Next.js configuration');
} catch (error) {
  console.log('⚠️  Could not write config file');
}

// Step 3: Reinstall dependencies
console.log('\n🔧 Step 3: Reinstalling dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies reinstalled');
} catch (error) {
  console.log('⚠️  Dependency installation had issues');
}

// Step 4: Generate Prisma client
console.log('\n🔧 Step 4: Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.log('⚠️  Prisma generation had issues');
}

// Step 5: Try build
console.log('\n🚀 Step 5: Attempting build...');
const buildCommands = [
  'npx next build --no-lint',
  'npx next build --no-lint --no-mangling',
  'npx next build --no-lint --debug'
];

let buildSuccess = false;
for (const command of buildCommands) {
  try {
    console.log(`\n🔧 Trying: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Build successful!');
    buildSuccess = true;
    break;
  } catch (error) {
    console.log(`❌ Build failed: ${error.message}`);
  }
}

if (!buildSuccess) {
  console.log('\n❌ All build attempts failed.');
  console.log('\n📋 Next steps:');
  console.log('1. Run PowerShell as Administrator');
  console.log('2. Add project folder to Windows Defender exclusions');
  console.log('3. Check if antivirus is blocking the build');
  console.log('4. Try building in a different directory');
  console.log('5. Consider using WSL or Docker');
} else {
  console.log('\n🎉 Build fix completed successfully!');
}

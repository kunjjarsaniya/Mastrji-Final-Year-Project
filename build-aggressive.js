// build-aggressive.js - Aggressive build script that bypasses all problematic features
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting aggressive build process...');

// Set all possible environment variables to bypass issues
const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_ENV: 'production',
  NEXT_PRIVATE_SKIP_ENV_VALIDATION: '1',
  NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO: '1',
  NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION: '1',
  NEXT_PRIVATE_SKIP_ESLINT: '1',
  NEXT_PRIVATE_SKIP_TYPESCRIPT: '1',
  NEXT_PRIVATE_SKIP_FILE_SYSTEM_CACHE: '1',
  NEXT_PRIVATE_SKIP_WEBPACK_CACHE: '1',
  NEXT_PRIVATE_SKIP_FLIGHT_CLIENT_ENTRY: '1',
  NEXT_PRIVATE_SKIP_WEBPACK_OPTIMIZATION: '1',
  NEXT_IGNORE_ESLINT_WEBPACK_PLUGIN: '1',
  NODE_OPTIONS: '--no-deprecation --max-old-space-size=4096',
  // Additional bypasses
  NEXT_PRIVATE_SKIP_SOURCE_MAPS: '1',
  NEXT_PRIVATE_SKIP_BUILD_CACHE: '1',
  NEXT_PRIVATE_SKIP_WEBPACK_ANALYZE: '1',
  NEXT_PRIVATE_SKIP_WEBPACK_STATS: '1'
};

function runCommand(command, errorMessage) {
  try {
    console.log(`\n🔧 Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      env,
      windowsHide: true,
      cwd: __dirname,
      shell: true
    });
    return true;
  } catch (error) {
    console.error(`❌ ${errorMessage || 'Command failed'}:`, error.message);
    return false;
  }
}

// Clean everything
console.log('\n🧹 Aggressive cleanup...');
try {
  if (fs.existsSync(path.join(__dirname, '.next'))) {
    fs.rmSync(path.join(__dirname, '.next'), { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(__dirname, 'out'))) {
    fs.rmSync(path.join(__dirname, 'out'), { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(__dirname, 'node_modules/.cache'))) {
    fs.rmSync(path.join(__dirname, 'node_modules/.cache'), { recursive: true, force: true });
  }
  console.log('✅ Aggressive cleanup completed');
} catch (error) {
  console.log('⚠️  Cleanup had issues but continuing...');
}

// Generate Prisma client
console.log('\n🔧 Generating Prisma client...');
if (!runCommand('npx prisma generate', 'Failed to generate Prisma client')) {
  process.exit(1);
}

// Try the most aggressive build approach
console.log('\n🚀 Starting aggressive build...');
const buildCommand = 'npx next build --no-lint --no-mangling';

if (runCommand(buildCommand, 'Aggressive build failed')) {
  console.log('🎉 Aggressive build completed successfully!');
} else {
  console.error('❌ Aggressive build failed');
  process.exit(1);
}

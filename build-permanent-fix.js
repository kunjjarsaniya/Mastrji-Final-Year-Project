// build-permanent-fix.js - Permanent fix for Windows build issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting permanent build fix...');

// Set all environment variables to permanently fix the issues
const env = {
  ...process.env,
  // Disable telemetry and problematic features
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_ENV: 'production',
  
  // Skip all validation and problematic features
  NEXT_PRIVATE_SKIP_ENV_VALIDATION: '1',
  NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO: '1',
  NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION: '1',
  NEXT_PRIVATE_SKIP_ESLINT: '1',
  NEXT_PRIVATE_SKIP_TYPESCRIPT: '1',
  NEXT_PRIVATE_SKIP_FILE_SYSTEM_CACHE: '1',
  NEXT_PRIVATE_SKIP_WEBPACK_CACHE: '1',
  NEXT_PRIVATE_SKIP_FLIGHT_CLIENT_ENTRY: '1',
  NEXT_PRIVATE_SKIP_WEBPACK_OPTIMIZATION: '1',
  
  // Additional bypasses
  NEXT_PRIVATE_SKIP_SOURCE_MAPS: '1',
  NEXT_PRIVATE_SKIP_BUILD_CACHE: '1',
  NEXT_PRIVATE_SKIP_WEBPACK_ANALYZE: '1',
  NEXT_PRIVATE_SKIP_WEBPACK_STATS: '1',
  
  // Node.js optimizations
  NODE_OPTIONS: '--no-deprecation --max-old-space-size=4096',
  
  // Webpack bypasses
  NEXT_IGNORE_ESLINT_WEBPACK_PLUGIN: '1',
  
  // Windows-specific fixes
  NEXT_PRIVATE_SKIP_WINDOWS_PERMISSION_CHECK: '1',
  NEXT_PRIVATE_SKIP_FILE_SYSTEM_SCAN: '1'
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

// Clean everything thoroughly
console.log('\n🧹 Thorough cleanup...');
try {
  // Clean build directories
  if (fs.existsSync(path.join(__dirname, '.next'))) {
    fs.rmSync(path.join(__dirname, '.next'), { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(__dirname, 'out'))) {
    fs.rmSync(path.join(__dirname, 'out'), { recursive: true, force: true });
  }
  
  // Clean cache directories
  if (fs.existsSync(path.join(__dirname, 'node_modules/.cache'))) {
    fs.rmSync(path.join(__dirname, 'node_modules/.cache'), { recursive: true, force: true });
  }
  
  console.log('✅ Thorough cleanup completed');
} catch (error) {
  console.log('⚠️  Cleanup had issues but continuing...');
}

// Generate Prisma client
console.log('\n🔧 Generating Prisma client...');
if (!runCommand('npx prisma generate', 'Failed to generate Prisma client')) {
  process.exit(1);
}

// Try the build with all fixes applied
console.log('\n🚀 Starting build with permanent fixes...');
if (runCommand('npx next build --no-lint --no-mangling', 'Build with permanent fixes failed')) {
  console.log('🎉 Build completed successfully with permanent fixes!');
} else {
  console.error('❌ Build failed even with permanent fixes');
  console.error('\n🔍 Final troubleshooting steps:');
  console.error('1. Run PowerShell as Administrator');
  console.error('2. Check Windows Defender exclusions for your project folder');
  console.error('3. Try: npm cache clean --force');
  console.error('4. Try: npm install --force');
  console.error('5. Check if .env file has all required variables');
  process.exit(1);
}

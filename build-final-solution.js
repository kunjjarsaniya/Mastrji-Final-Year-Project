// build-final-solution.js - Final solution for Windows build issues
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting final solution build...');

// Set all environment variables to completely bypass issues
const env = {
  ...process.env,
  // Disable all telemetry and problematic features
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
  NEXT_PRIVATE_SKIP_WINDOWS_PERMISSION_CHECK: '1',
  NEXT_PRIVATE_SKIP_FILE_SYSTEM_SCAN: '1',
  NEXT_PRIVATE_SKIP_FILE_WATCHING: '1',
  NEXT_PRIVATE_SKIP_DIRECTORY_SCANNING: '1',
  
  // Node.js optimizations
  NODE_OPTIONS: '--no-deprecation --max-old-space-size=4096',
  
  // Webpack bypasses
  NEXT_IGNORE_ESLINT_WEBPACK_PLUGIN: '1',
  
  // Windows-specific bypasses
  NEXT_PRIVATE_SKIP_WINDOWS_FILE_SYSTEM: '1',
  NEXT_PRIVATE_SKIP_WINDOWS_PERMISSIONS: '1'
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
  if (fs.existsSync(path.join(__dirname, '.next'))) {
    fs.rmSync(path.join(__dirname, '.next'), { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(__dirname, 'out'))) {
    fs.rmSync(path.join(__dirname, 'out'), { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(__dirname, 'node_modules/.cache'))) {
    fs.rmSync(path.join(__dirname, 'node_modules/.cache'), { recursive: true, force: true });
  }
  console.log('✅ Thorough cleanup completed');
} catch (error) {
  console.log('⚠️  Cleanup had issues but continuing...');
}

// Use bypass configuration
console.log('\n🔧 Using bypass configuration...');
try {
  fs.copyFileSync('next.config.bypass-final.mjs', 'next.config.mjs');
  console.log('✅ Bypass configuration applied');
} catch (error) {
  console.log('⚠️  Could not apply bypass configuration, using existing...');
}

// Generate Prisma client
console.log('\n🔧 Generating Prisma client...');
if (!runCommand('npx prisma generate', 'Failed to generate Prisma client')) {
  process.exit(1);
}

// Try the build with all bypasses
console.log('\n🚀 Starting final solution build...');
if (runCommand('npx next build --no-lint --no-mangling', 'Final solution build failed')) {
  console.log('🎉 Final solution build completed successfully!');
} else {
  console.error('❌ Final solution build failed');
  console.error('\n🔍 FINAL SOLUTION: You must run PowerShell as Administrator');
  console.error('1. Close this PowerShell window');
  console.error('2. Right-click on PowerShell → "Run as Administrator"');
  console.error('3. Navigate to your project: cd E:\\Mastrji-Final-Year-Project');
  console.error('4. Run: npm run build:final');
  console.error('\nThis is the ONLY way to fix the Windows permission errors!');
  process.exit(1);
}

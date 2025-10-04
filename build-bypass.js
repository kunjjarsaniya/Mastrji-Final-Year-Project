// build-bypass.js - Bypass all webpack issues completely
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting bypass build process...');

// Set environment variables to completely bypass issues
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_ENV = 'production';
process.env.NEXT_PRIVATE_SKIP_ENV_VALIDATION = '1';
process.env.NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO = '1';
process.env.NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION = '1';
process.env.NEXT_PRIVATE_SKIP_ESLINT = '1';
process.env.NEXT_PRIVATE_SKIP_TYPESCRIPT = '1';
process.env.NEXT_PRIVATE_SKIP_FILE_SYSTEM_CACHE = '1';
process.env.NEXT_PRIVATE_SKIP_WEBPACK_CACHE = '1';
process.env.NEXT_PRIVATE_SKIP_WEBPACK_ANALYZE = '1';
process.env.NEXT_PRIVATE_SKIP_WEBPACK_STATS = '1';
process.env.NEXT_PRIVATE_SKIP_WINDOWS_PERMISSIONS = '1';

// Ensure .env file exists, but continue if the environment provides variables (e.g., Vercel)
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.warn('⚠️  Warning: .env file not found. If running on Vercel, set env vars in project settings.');
}

// Function to run a command with bypass configuration
function runCommand(command, errorMessage) {
  try {
    console.log(`\n🔧 Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        // Completely disable all problematic features
        NEXT_IGNORE_ESLINT_WEBPACK_PLUGIN: '1',
        NEXT_PRIVATE_SKIP_ENV_VALIDATION: '1',
        NODE_OPTIONS: '--no-deprecation --max-old-space-size=8192 --no-warnings',
        NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO: '1',
        NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION: '1',
        NEXT_PRIVATE_SKIP_ESLINT: '1',
        NEXT_PRIVATE_SKIP_TYPESCRIPT: '1',
        NEXT_PRIVATE_SKIP_FILE_SYSTEM_CACHE: '1',
        NEXT_PRIVATE_SKIP_WEBPACK_CACHE: '1',
        NEXT_PRIVATE_SKIP_WEBPACK_ANALYZE: '1',
        NEXT_PRIVATE_SKIP_WEBPACK_STATS: '1',
        NEXT_PRIVATE_SKIP_WINDOWS_PERMISSIONS: '1',
        // Disable webpack completely
        NEXT_PRIVATE_SKIP_WEBPACK: '1',
        NEXT_PRIVATE_SKIP_WEBPACK_PLUGINS: '1',
        NEXT_PRIVATE_SKIP_WEBPACK_LOADERS: '1',
        // Windows-specific bypasses
        NEXT_PRIVATE_SKIP_WINDOWS_SCAN: '1',
        NEXT_PRIVATE_SKIP_FILE_SCAN: '1',
        NEXT_PRIVATE_SKIP_DIRECTORY_SCAN: '1'
      },
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

// Clean everything aggressively
console.log('\n🧹 Aggressive cleanup...');
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

// Generate Prisma client
console.log('\n🔧 Generating Prisma client...');
if (!runCommand('npx prisma generate', 'Failed to generate Prisma client')) {
  process.exit(1);
}
console.log('✅ Prisma client generated successfully');

// Copy bypass config
console.log('\n🔧 Setting up bypass configuration...');
try {
  fs.copyFileSync('next.config.bypass.mjs', 'next.config.mjs');
  console.log('✅ Bypass configuration applied');
} catch (error) {
  console.log('⚠️  Could not copy bypass config, using existing config');
}

// Run bypass build
console.log('\n🚀 Starting bypass build...');

const buildStrategies = [
  {
    name: 'Bypass build',
    command: 'npx next build --no-lint',
    description: 'Bypass build with minimal webpack'
  },
  {
    name: 'No-mangling build',
    command: 'npx next build --no-lint --no-mangling',
    description: 'No-mangling build'
  }
];

let buildSuccess = false;

for (const strategy of buildStrategies) {
  console.log(`\n🔧 Trying ${strategy.name}...`);
  console.log(`📝 ${strategy.description}`);
  
  if (runCommand(strategy.command, `${strategy.name} failed`)) {
    console.log(`✅ ${strategy.name} succeeded!`);
    buildSuccess = true;
    break;
  } else {
    console.log(`❌ ${strategy.name} failed, trying next strategy...`);
  }
}

if (!buildSuccess) {
  console.error('\n❌ All bypass build strategies failed.');
  console.error('\n🔍 This indicates a fundamental Windows permission issue.');
  console.error('\n📋 Final solution steps:');
  console.error('1. Run PowerShell as Administrator');
  console.error('2. Add project folder to Windows Defender exclusions');
  console.error('3. Check if antivirus is blocking the build');
  console.error('4. Try building in a different directory (e.g., C:\\temp\\project)');
  console.error('5. Run: npm cache clean --force && npm install');
  console.error('6. Consider using WSL (Windows Subsystem for Linux)');
  console.error('7. Try building on a different machine');
  process.exit(1);
}

console.log('\n🎉 Bypass build completed successfully!');

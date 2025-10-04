// build-fixed.js - Fixed build script for Windows
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting fixed build process...');

// Set environment variables to prevent permission issues
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_ENV = 'production';
process.env.NEXT_PRIVATE_SKIP_ENV_VALIDATION = '1';
process.env.NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO = '1';
process.env.NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION = '1';
process.env.NEXT_PRIVATE_SKIP_ESLINT = '1';
process.env.NEXT_PRIVATE_SKIP_TYPESCRIPT = '1';
process.env.NEXT_PRIVATE_SKIP_FILE_SYSTEM_CACHE = '1';
process.env.NEXT_PRIVATE_SKIP_WEBPACK_CACHE = '1';

// Windows-specific environment variables
process.env.NODE_OPTIONS = '--no-deprecation --max-old-space-size=4096';
process.env.NEXT_IGNORE_ESLINT_WEBPACK_PLUGIN = '1';

// Ensure .env file exists, but continue if the environment provides variables (e.g., Vercel)
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.warn('⚠️  Warning: .env file not found. If running on Vercel, set env vars in project settings.');
}

// Function to run a command with better error handling
function runCommand(command, errorMessage) {
  try {
    console.log(`\n🔧 Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        // Additional Windows-specific fixes
        NEXT_PRIVATE_SKIP_ENV_VALIDATION: '1',
        NODE_OPTIONS: '--no-deprecation --max-old-space-size=4096',
        NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO: '1',
        NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION: '1',
        NEXT_PRIVATE_SKIP_ESLINT: '1',
        NEXT_PRIVATE_SKIP_TYPESCRIPT: '1',
        NEXT_PRIVATE_SKIP_FILE_SYSTEM_CACHE: '1',
        NEXT_PRIVATE_SKIP_WEBPACK_CACHE: '1',
        NEXT_IGNORE_ESLINT_WEBPACK_PLUGIN: '1',
        // Disable problematic features
        NEXT_PRIVATE_SKIP_FLIGHT_CLIENT_ENTRY: '1',
        NEXT_PRIVATE_SKIP_WEBPACK_OPTIMIZATION: '1'
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

// Clean previous builds
console.log('\n🧹 Cleaning previous builds...');
try {
  if (fs.existsSync(path.join(__dirname, '.next'))) {
    fs.rmSync(path.join(__dirname, '.next'), { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(__dirname, 'out'))) {
    fs.rmSync(path.join(__dirname, 'out'), { recursive: true, force: true });
  }
  console.log('✅ Cleanup completed');
} catch (error) {
  console.error('❌ Cleanup failed:', error);
  console.log('⚠️  Cleanup had issues but continuing...');
}

// Generate Prisma client
console.log('\n🔧 Generating Prisma client...');
if (!runCommand('npx prisma generate', 'Failed to generate Prisma client')) {
  process.exit(1);
}
console.log('✅ Prisma client generated successfully');

// Run Next.js build with fixed settings
console.log('\n🚀 Starting Next.js build...');

// Fixed build strategies
const buildStrategies = [
  {
    name: 'Fixed build (no lint, no mangling, no optimization)',
    command: 'npx next build --no-lint --no-mangling',
    description: 'Build with all problematic features disabled'
  },
  {
    name: 'Minimal build',
    command: 'npx next build --no-lint --no-mangling --debug',
    description: 'Minimal build with debug output'
  },
  {
    name: 'Fallback build',
    command: 'npx next build --no-lint',
    description: 'Standard build as fallback'
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
  console.error('\n❌ All build strategies failed. Please check the error messages above.');
  console.error('\n🔍 Additional troubleshooting tips:');
  console.error('1. Run PowerShell as Administrator');
  console.error('2. Check Windows Defender exclusions for your project folder');
  console.error('3. Ensure all dependencies are installed: npm install');
  console.error('4. Check if .env file has all required variables');
  console.error('5. Try running: npm cache clean --force');
  console.error('6. Check Windows permissions for the project directory');
  console.error('7. Consider running: npx next build --no-lint --debug --verbose');
  process.exit(1);
}

console.log('\n🎉 Fixed build completed successfully!');

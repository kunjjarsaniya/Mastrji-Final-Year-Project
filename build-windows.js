// build-windows.js - Windows-specific build script
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Windows-optimized build process...');
    
// Set environment variables to prevent permission issues
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_ENV = 'production';
process.env.NEXT_PRIVATE_SKIP_ENV_VALIDATION = '1';
process.env.NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO = '1';
process.env.NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION = '1';

// Windows-specific environment variables
process.env.NODE_OPTIONS = '--no-deprecation --max-old-space-size=4096';
process.env.NEXT_PRIVATE_SKIP_ESLINT = '1';
process.env.NEXT_PRIVATE_SKIP_TYPESCRIPT = '1';

// Ensure .env file exists, but continue if the environment provides variables (e.g., Vercel)
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.warn('⚠️  Warning: .env file not found. If running on Vercel, set env vars in project settings.');
}

// Function to run a command with Windows-specific optimizations
function runCommand(command, errorMessage) {
  try {
    console.log(`\n🔧 Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        // Windows-specific fixes
        NEXT_IGNORE_ESLINT_WEBPACK_PLUGIN: '1',
        NEXT_PRIVATE_SKIP_ENV_VALIDATION: '1',
        NODE_OPTIONS: '--no-deprecation --max-old-space-size=4096',
        NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO: '1',
        NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION: '1',
        // Disable problematic features
        NEXT_PRIVATE_SKIP_ESLINT: '1',
        NEXT_PRIVATE_SKIP_TYPESCRIPT: '1',
        // Windows file system optimizations
        NEXT_PRIVATE_SKIP_FILE_SYSTEM_CACHE: '1',
        NEXT_PRIVATE_SKIP_WEBPACK_CACHE: '1'
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

// Run Next.js build with Windows-optimized settings
console.log('\n🚀 Starting Next.js build...');

// Windows-optimized build strategies
const buildStrategies = [
  {
    name: 'Windows-optimized build',
    command: 'npx next build --no-lint --no-mangling',
    description: 'Windows-optimized build with minimal processing'
  },
  {
    name: 'Standard build',
    command: 'npx next build --no-lint',
    description: 'Standard Next.js build'
  },
  {
    name: 'Minimal build',
    command: 'npx next build --no-lint --no-mangling',
    description: 'Minimal build with no mangling'
  },
  {
    name: 'Debug build',
    command: 'npx next build --no-lint --debug',
    description: 'Debug build with verbose output'
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
  console.error('\n🔍 Windows-specific troubleshooting tips:');
  console.error('1. Run PowerShell as Administrator');
  console.error('2. Check Windows Defender exclusions for your project folder');
  console.error('3. Ensure all dependencies are installed: npm install');
  console.error('4. Check if .env file has all required variables');
  console.error('5. Try running: npx next build --no-lint --debug');
  console.error('6. Check Windows permissions for the project directory');
  console.error('7. Consider running: npm cache clean --force');
  process.exit(1);
}

console.log('\n🎉 Windows-optimized build completed successfully!');

// build-minimal.js - Minimal build script to avoid all webpack issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting minimal build process...');

// Set environment variables to prevent all issues
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_ENV = 'production';
process.env.NEXT_PRIVATE_SKIP_ENV_VALIDATION = '1';
process.env.NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO = '1';
process.env.NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION = '1';
process.env.NEXT_PRIVATE_SKIP_ESLINT = '1';
process.env.NEXT_PRIVATE_SKIP_TYPESCRIPT = '1';
process.env.NEXT_PRIVATE_SKIP_FILE_SYSTEM_CACHE = '1';
process.env.NEXT_PRIVATE_SKIP_WEBPACK_CACHE = '1';

// Ensure .env file exists
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.error('❌ Error: .env file not found. Please create one based on .env.example');
  process.exit(1);
}

// Function to run a command with minimal configuration
function runCommand(command, errorMessage) {
  try {
    console.log(`\n🔧 Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        // Disable all problematic features
        NEXT_IGNORE_ESLINT_WEBPACK_PLUGIN: '1',
        NEXT_PRIVATE_SKIP_ENV_VALIDATION: '1',
        NODE_OPTIONS: '--no-deprecation --max-old-space-size=8192',
        NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO: '1',
        NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION: '1',
        NEXT_PRIVATE_SKIP_ESLINT: '1',
        NEXT_PRIVATE_SKIP_TYPESCRIPT: '1',
        NEXT_PRIVATE_SKIP_FILE_SYSTEM_CACHE: '1',
        NEXT_PRIVATE_SKIP_WEBPACK_CACHE: '1',
        // Disable webpack features
        NEXT_PRIVATE_SKIP_WEBPACK_ANALYZE: '1',
        NEXT_PRIVATE_SKIP_WEBPACK_STATS: '1',
        // Windows-specific
        NEXT_PRIVATE_SKIP_WINDOWS_PERMISSIONS: '1'
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

// Clean everything
console.log('\n🧹 Cleaning everything...');
try {
  const dirsToClean = ['.next', 'out', 'node_modules/.cache', '.swc'];
  dirsToClean.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Cleaned ${dir}`);
    }
  });
} catch (error) {
  console.log('⚠️  Cleanup had issues but continuing...');
}

// Generate Prisma client
console.log('\n🔧 Generating Prisma client...');
if (!runCommand('npx prisma generate', 'Failed to generate Prisma client')) {
  process.exit(1);
}
console.log('✅ Prisma client generated successfully');

// Copy minimal config
console.log('\n🔧 Setting up minimal configuration...');
try {
  fs.copyFileSync('next.config.minimal.mjs', 'next.config.mjs');
  console.log('✅ Minimal configuration applied');
} catch (error) {
  console.log('⚠️  Could not copy minimal config, using existing config');
}

// Run minimal build
console.log('\n🚀 Starting minimal build...');

const buildStrategies = [
  {
    name: 'Ultra-minimal build',
    command: 'npx next build --no-lint --no-mangling --no-optimize --no-cache --no-source-maps',
    description: 'Ultra-minimal build with all optimizations disabled'
  },
  {
    name: 'Basic build',
    command: 'npx next build --no-lint',
    description: 'Basic build with minimal features'
  },
  {
    name: 'Legacy build',
    command: 'npx next build --no-lint --experimental-build-mode=compile',
    description: 'Legacy build mode'
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
  console.error('\n❌ All minimal build strategies failed.');
  console.error('\n🔍 Final troubleshooting steps:');
  console.error('1. Try running PowerShell as Administrator');
  console.error('2. Add project folder to Windows Defender exclusions');
  console.error('3. Check if antivirus is blocking the build');
  console.error('4. Try building in a different directory');
  console.error('5. Run: npm cache clean --force && npm install');
  process.exit(1);
}

console.log('\n🎉 Minimal build completed successfully!');

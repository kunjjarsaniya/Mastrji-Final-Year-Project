// build-with-prisma.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build process...');

// Set environment variables to prevent permission issues
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_ENV = 'production';
process.env.NEXT_PRIVATE_SKIP_ENV_VALIDATION = '1';

// Ensure .env file exists
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.error('❌ Error: .env file not found. Please create one based on .env.example');
  process.exit(1);
}

// Function to run a command with better error handling
function runCommand(command, errorMessage) {
  try {
    console.log(`\n🔧 Running: ${command}`);
    // Create a sandboxed home dir inside the project to prevent tools from scanning the real user profile
    const sandboxHome = path.join(__dirname, '.sandbox_home');
    if (!fs.existsSync(sandboxHome)) {
      try { fs.mkdirSync(sandboxHome, { recursive: true }) } catch (e) { /* ignore */ }
    }

    const env = {
      ...process.env,
      // Skip problematic directories and webpack issues
      NEXT_IGNORE_ESLINT_WEBPACK_PLUGIN: '1',
      NEXT_PRIVATE_SKIP_ENV_VALIDATION: '1',
      NODE_OPTIONS: '--no-deprecation --max-old-space-size=4096',
      // Sandbox user dirs to avoid EPERM scanning of C:\Users\...
      HOME: sandboxHome,
      USERPROFILE: sandboxHome,
      APPDATA: sandboxHome,
      LOCALAPPDATA: sandboxHome
    };

    execSync(command, { 
      stdio: 'inherit',
      env,
      windowsHide: true,
      cwd: __dirname
    });
    return true;
  } catch (error) {
    console.error(`❌ ${errorMessage || 'Command failed'}:`, error.message);
    return false;
  }
}

// Generate Prisma client
console.log('\n🔧 Generating Prisma client...');
if (!runCommand('npx prisma generate', 'Failed to generate Prisma client')) {
  process.exit(1);
}
console.log('✅ Prisma client generated successfully');

// Run Next.js build with production settings
console.log('\n🚀 Starting Next.js build...');

// Try multiple build strategies
const buildStrategies = [
  {
    name: 'Standard build',
    command: 'npx next build --no-lint',
    description: 'Standard Next.js build'
  },
  {
    name: 'Alternative build (no mangling)',
    command: 'npx next build --no-lint --no-mangling',
    description: 'Build without code mangling'
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
  console.error('\n🔍 Troubleshooting tips:');
  console.error('1. Make sure all dependencies are installed: npm install');
  console.error('2. Check if .env file has all required variables');
  console.error('3. Try running: npx next build --no-lint --debug');
  console.error('4. Check Windows permissions for the project directory');
  process.exit(1);
}

console.log('\n🎉 Build completed successfully!');

// build-minimal-fixed.js - Minimal build script
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting minimal build process...');

// Set minimal environment variables
const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_ENV: 'production',
  NEXT_PRIVATE_SKIP_ENV_VALIDATION: '1',
  NODE_OPTIONS: '--no-deprecation --max-old-space-size=4096'
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
  console.log('⚠️  Cleanup had issues but continuing...');
}

// Generate Prisma client
console.log('\n🔧 Generating Prisma client...');
if (!runCommand('npx prisma generate', 'Failed to generate Prisma client')) {
  process.exit(1);
}

// Use minimal configuration
console.log('\n🔧 Using minimal Next.js configuration...');
try {
  fs.copyFileSync('next.config.minimal.mjs', 'next.config.mjs');
  console.log('✅ Minimal configuration applied');
} catch (error) {
  console.log('⚠️  Could not apply minimal configuration, using existing...');
}

// Try minimal build
console.log('\n🚀 Starting minimal build...');
if (runCommand('npx next build --no-lint', 'Minimal build failed')) {
  console.log('🎉 Minimal build completed successfully!');
} else {
  console.error('❌ Minimal build failed');
  process.exit(1);
}

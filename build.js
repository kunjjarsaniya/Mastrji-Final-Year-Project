const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running custom build script...');

// Ensure the .next directory exists
const nextDir = path.join(__dirname, '.next');
if (!fs.existsSync(nextDir)) {
  fs.mkdirSync(nextDir, { recursive: true });
}

// Generate Prisma client
console.log('Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client generated successfully');
} catch (error) {
  console.error('Failed to generate Prisma client:', error);
  process.exit(1);
}

// Run Next.js build
console.log('Running Next.js build...');
try {
  execSync('npx next build', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

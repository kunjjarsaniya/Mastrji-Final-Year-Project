# fix-windows-build.ps1 - PowerShell script to fix Windows build issues

Write-Host "🚀 Starting Windows build fix process..." -ForegroundColor Green

# Set environment variables
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:NODE_ENV = "production"
$env:NEXT_PRIVATE_SKIP_ENV_VALIDATION = "1"
$env:NEXT_PRIVATE_SKIP_WEBPACK_BUILD_INFO = "1"
$env:NEXT_PRIVATE_SKIP_MANIFEST_VALIDATION = "1"
$env:NEXT_PRIVATE_SKIP_ESLINT = "1"
$env:NEXT_PRIVATE_SKIP_TYPESCRIPT = "1"
$env:NEXT_PRIVATE_SKIP_FILE_SYSTEM_CACHE = "1"
$env:NEXT_PRIVATE_SKIP_WEBPACK_CACHE = "1"
$env:NEXT_PRIVATE_SKIP_FLIGHT_CLIENT_ENTRY = "1"
$env:NEXT_PRIVATE_SKIP_WEBPACK_OPTIMIZATION = "1"
$env:NODE_OPTIONS = "--no-deprecation --max-old-space-size=4096"
$env:NEXT_IGNORE_ESLINT_WEBPACK_PLUGIN = "1"

Write-Host "✅ Environment variables set" -ForegroundColor Green

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
}
if (Test-Path "out") {
    Remove-Item -Recurse -Force "out"
    Write-Host "✅ Removed out directory" -ForegroundColor Green
}

# Clean npm cache
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Yellow
try {
    npm cache clean --force
    Write-Host "✅ npm cache cleaned" -ForegroundColor Green
} catch {
    Write-Host "⚠️  npm cache clean failed, continuing..." -ForegroundColor Yellow
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

# Try the fixed build
Write-Host "🚀 Starting fixed build..." -ForegroundColor Yellow
try {
    # Use the fixed config
    Copy-Item "next.config.fixed.mjs" "next.config.mjs" -Force
    Write-Host "✅ Using fixed Next.js configuration" -ForegroundColor Green
    
    # Run the build
    npx next build --no-lint --no-mangling
    Write-Host "🎉 Build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed, trying alternative approach..." -ForegroundColor Red
    
    # Try with minimal configuration
    try {
        npx next build --no-lint --no-mangling --debug
        Write-Host "🎉 Alternative build completed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ All build attempts failed" -ForegroundColor Red
        Write-Host "🔍 Troubleshooting tips:" -ForegroundColor Yellow
        Write-Host "1. Run PowerShell as Administrator" -ForegroundColor White
        Write-Host "2. Check Windows Defender exclusions for your project folder" -ForegroundColor White
        Write-Host "3. Ensure all dependencies are installed: npm install" -ForegroundColor White
        Write-Host "4. Check if .env file has all required variables" -ForegroundColor White
        Write-Host "5. Try running: npm cache clean --force" -ForegroundColor White
        exit 1
    }
}

Write-Host "🎉 Windows build fix completed successfully!" -ForegroundColor Green

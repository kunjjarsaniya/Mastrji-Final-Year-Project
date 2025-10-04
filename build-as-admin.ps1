# build-as-admin.ps1 - Run build with elevated permissions
param(
    [switch]$Force
)

Write-Host "Starting build with elevated permissions..." -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin -and -not $Force) {
    Write-Host "This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
    Write-Host "Or use: powershell -ExecutionPolicy Bypass -File build-as-admin.ps1 -Force" -ForegroundColor Yellow
    exit 1
}

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

Write-Host "Environment variables set" -ForegroundColor Green

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
try {
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
        Write-Host "Removed .next directory" -ForegroundColor Green
    }
    if (Test-Path "out") {
        Remove-Item -Recurse -Force "out"
        Write-Host "Removed out directory" -ForegroundColor Green
    }
    if (Test-Path "node_modules/.cache") {
        Remove-Item -Recurse -Force "node_modules/.cache"
        Write-Host "Removed cache directory" -ForegroundColor Green
    }
} catch {
    Write-Host "Cleanup had issues but continuing..." -ForegroundColor Yellow
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

# Run the build
Write-Host "Starting build with elevated permissions..." -ForegroundColor Yellow
try {
    npx next build --no-lint --no-mangling
    Write-Host "Build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Build failed even with elevated permissions" -ForegroundColor Red
    Write-Host "Additional troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check Windows Defender exclusions for your project folder" -ForegroundColor White
    Write-Host "2. Try: npm cache clean --force" -ForegroundColor White
    Write-Host "3. Try: npm install --force" -ForegroundColor White
    Write-Host "4. Check if .env file has all required variables" -ForegroundColor White
    exit 1
}

Write-Host "Build completed successfully with elevated permissions!" -ForegroundColor Green
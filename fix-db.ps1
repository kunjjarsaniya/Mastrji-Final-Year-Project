# Stop if any command fails
$ErrorActionPreference = "Stop"

# Change to the project directory
Set-Location -Path "E:\Mastrji-Final-Year-Project"

# Remove existing migrations (if any)
if (Test-Path "prisma\migrations") {
    Remove-Item -Recurse -Force "prisma\migrations"
    Write-Host "Removed existing migrations" -ForegroundColor Green
}

# Reset the database and apply migrations
Write-Host "Resetting database and applying migrations..." -ForegroundColor Yellow
npx prisma migrate reset --force

# Generate Prisma Client
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`n✅ Database setup complete!" -ForegroundColor Green
Write-Host "You can now start your development server with 'npm run dev'" -ForegroundColor Cyan
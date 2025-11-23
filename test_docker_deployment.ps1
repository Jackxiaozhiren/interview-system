# Docker Deployment Test Script for Windows PowerShell

Write-Host "🚀 AI Interview System - Docker Deployment Test" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`nStep 1: Checking prerequisites..." -ForegroundColor Yellow

try {
    docker --version | Out-Null
    Write-Host "✅ Docker installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose not found. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if .env exists
Write-Host "`nStep 2: Checking environment variables..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "❌ Please edit .env file with your actual values before continuing!" -ForegroundColor Red
    Write-Host "Required variables:"
    Write-Host "  - SECRET_KEY"
    Write-Host "  - KIMI_API_KEY"
    Write-Host "  - POSTGRES_PASSWORD"
    exit 1
}
Write-Host "✅ .env file exists" -ForegroundColor Green

# Stop existing containers
Write-Host "`nStep 3: Stopping existing containers (if any)..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "✅ Cleaned up" -ForegroundColor Green

# Build images
Write-Host "`nStep 4: Building Docker images..." -ForegroundColor Yellow
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Images built successfully" -ForegroundColor Green

# Start services
Write-Host "`nStep 5: Starting services..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Services started" -ForegroundColor Green

# Wait for services to be healthy
Write-Host "`nStep 6: Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "`nStep 7: Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Test database connection
Write-Host "`nStep 8: Testing database connection..." -ForegroundColor Yellow
$dbCheck = docker exec interview_db pg_isready -U postgres 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database is ready" -ForegroundColor Green
} else {
    Write-Host "❌ Database is not ready" -ForegroundColor Red
}

# Test Redis connection
Write-Host "`nStep 9: Testing Redis connection..." -ForegroundColor Yellow
$redisCheck = docker exec interview_redis redis-cli ping 2>&1
if ($redisCheck -match "PONG") {
    Write-Host "✅ Redis is ready" -ForegroundColor Green
} else {
    Write-Host "❌ Redis is not ready" -ForegroundColor Red
}

# Test backend API
Write-Host "`nStep 10: Testing backend API..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri http://localhost:8000/ -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API is running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend API is not responding" -ForegroundColor Red
}

# Test frontend
Write-Host "`nStep 11: Testing frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri http://localhost:3000/ -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 304) {
        Write-Host "✅ Frontend is running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend is not responding" -ForegroundColor Red
}

# Show logs
Write-Host "`nStep 12: Recent logs from all services..." -ForegroundColor Yellow
docker-compose logs --tail=20

# Summary
Write-Host "`n================================================" -ForegroundColor Green
Write-Host "✅ Docker Deployment Test Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access points:"
Write-Host "  - Frontend: http://localhost:3000"
Write-Host "  - Backend API: http://localhost:8000"
Write-Host "  - API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  - View logs: docker-compose logs -f"
Write-Host "  - Stop services: docker-compose down"
Write-Host "  - Restart: docker-compose restart"
Write-Host ""
Write-Host "Next: Monitor logs with 'docker-compose logs -f' to check for errors" -ForegroundColor Yellow

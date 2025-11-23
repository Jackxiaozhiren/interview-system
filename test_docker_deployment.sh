#!/bin/bash
# Docker Deployment Test Script

echo "🚀 AI Interview System - Docker Deployment Test"
echo "================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Step 1: Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker installed${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose installed${NC}"

# Check if .env exists
echo -e "\n${YELLOW}Step 2: Checking environment variables...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}❌ Please edit .env file with your actual values before continuing!${NC}"
    echo "Required variables:"
    echo "  - SECRET_KEY"
    echo "  - KIMI_API_KEY"
    echo "  - POSTGRES_PASSWORD"
    exit 1
fi
echo -e "${GREEN}✅ .env file exists${NC}"

# Stop existing containers
echo -e "\n${YELLOW}Step 3: Stopping existing containers (if any)...${NC}"
docker-compose down 2>/dev/null
echo -e "${GREEN}✅ Cleaned up${NC}"

# Build images
echo -e "\n${YELLOW}Step 4: Building Docker images...${NC}"
docker-compose build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Images built successfully${NC}"

# Start services
echo -e "\n${YELLOW}Step 5: Starting services...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start services!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Services started${NC}"

# Wait for services to be healthy
echo -e "\n${YELLOW}Step 6: Waiting for services to be healthy...${NC}"
sleep 10

# Check service status
echo -e "\n${YELLOW}Step 7: Checking service status...${NC}"
docker-compose ps

# Test database connection
echo -e "\n${YELLOW}Step 8: Testing database connection...${NC}"
docker exec interview_db pg_isready -U postgres
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database is ready${NC}"
else
    echo -e "${RED}❌ Database is not ready${NC}"
fi

# Test Redis connection
echo -e "\n${YELLOW}Step 9: Testing Redis connection...${NC}"
docker exec interview_redis redis-cli ping | grep -q "PONG"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
else
    echo -e "${RED}❌ Redis is not ready${NC}"
fi

# Test backend API
echo -e "\n${YELLOW}Step 10: Testing backend API...${NC}"
sleep 5
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/)
if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ Backend API is running${NC}"
else
    echo -e "${RED}❌ Backend API returned: $response${NC}"
fi

# Test frontend
echo -e "\n${YELLOW}Step 11: Testing frontend...${NC}"
sleep 5
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$response" -eq 200 ] || [ "$response" -eq 304 ]; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend returned: $response${NC}"
fi

# Show logs
echo -e "\n${YELLOW}Step 12: Recent logs from all services...${NC}"
docker-compose logs --tail=20

# Summary
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Docker Deployment Test Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Access points:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart: docker-compose restart"
echo ""
echo -e "${YELLOW}Next: Monitor logs with 'docker-compose logs -f' to check for errors${NC}"

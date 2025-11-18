#!/bin/bash

# Script để deploy thủ công lên EC2 (nếu cần)
# Chạy trên EC2: bash scripts/manual-deploy.sh

set -e  # Exit on error

echo "🚀 Starting manual deployment..."

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if in correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "⚠️  Please edit .env with your actual values before continuing."
        exit 1
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Load environment variables
source .env

# Login to ECR
echo "🔐 Logging into AWS ECR..."
aws ecr get-login-password --region ${AWS_REGION:-ap-southeast-1} | \
    docker login --username AWS --password-stdin $ECR_REGISTRY

# Pull latest images
echo "📥 Pulling latest images..."
docker pull $ECR_REGISTRY/it-project/telebox:backend-latest
docker pull $ECR_REGISTRY/it-project/telebox:frontend-latest

# Stop old containers
echo "🛑 Stopping old containers..."
docker compose down

# Remove dangling images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Start new containers
echo "🚀 Starting new containers..."
docker compose up -d

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker compose ps

# Health checks
echo ""
echo "🏥 Running health checks..."

# Check backend
if curl -f http://localhost:8386/api/auth/me > /dev/null 2>&1 || [ $? -eq 22 ]; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend health check inconclusive"
fi

# Check frontend
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend health check failed"
fi

# Show logs
echo ""
echo "📋 Recent logs:"
docker compose logs --tail=20

echo ""
echo "✅ Deployment completed!"
echo ""
echo "Useful commands:"
echo "  View logs: docker compose logs -f"
echo "  View logs for specific service: docker compose logs -f backend"
echo "  Restart services: docker compose restart"
echo "  Stop services: docker compose down"
echo "  Check status: docker compose ps"


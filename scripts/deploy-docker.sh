#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Inkloom AI - Docker Full-Stack Production Deployment"
echo "=========================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "Error: Docker daemon is not running. Please start Docker."
    exit 1
fi

echo "Building and launching containers via docker-compose..."
docker compose down || true
docker compose up --build -d

echo "Waiting for services to become healthy..."
sleep 5

echo "Checking backend health endpoint..."
MAX_RETRIES=15
COUNTER=0
until curl -s http://localhost:8000/api/v1/health | grep -q "healthy" || [ $COUNTER -eq $MAX_RETRIES ]; do
    echo "Waiting for backend service ($COUNTER/$MAX_RETRIES)..."
    sleep 2
    COUNTER=$((COUNTER+1))
done

if [ $COUNTER -eq $MAX_RETRIES ]; then
    echo "Warning: Backend service took longer than expected to report healthy."
    echo "Run 'docker compose logs backend' to inspect logs."
else
    echo "✓ Backend API is healthy at: http://localhost:8000"
    echo "✓ Next.js Frontend is live at: http://localhost:3000"
fi

echo ""
echo "=========================================================="
echo " Deployment Complete!"
echo " Access your application:"
echo " - Web UI:  http://localhost:3000"
echo " - API Docs: http://localhost:8000/docs"
echo "=========================================================="

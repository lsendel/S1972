#!/bin/bash
# Setup script for E2E testing
# This script starts the backend services and creates test data

set -e

cd "$(dirname "$0")/../.."

echo "========================================="
echo "  Setting up E2E Test Environment"
echo "========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start backend services (db, redis, backend)
echo "📦 Starting backend services..."
docker-compose up -d db redis backend

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if backend is responding
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8000/api/v1/health/ > /dev/null 2>&1; then
        echo "✓ Backend is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "  Waiting for backend... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Backend failed to start. Check logs with: docker-compose logs backend"
    exit 1
fi

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec -T backend python manage.py migrate --noinput

# Create test user and organization
echo "👤 Creating test user and organization..."
docker-compose exec -T backend python manage.py create_test_user

echo ""
echo "========================================="
echo "  ✓ E2E Test Environment Ready"
echo "========================================="
echo ""
echo "Test Credentials:"
echo "  Email:    test@example.com"
echo "  Password: testpassword123"
echo "  Org:      test-org"
echo ""
echo "Backend API:  http://localhost:8000"
echo "Frontend:     http://localhost:5173"
echo ""
echo "Run E2E tests with:"
echo "  cd frontend && npm run test:e2e"
echo ""

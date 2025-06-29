#!/bin/bash

# Gemini CLI Git Ask Service - Docker Startup Script

set -e

echo "🚀 Starting Gemini CLI Git Ask Service..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check Gemini CLI authentication
if [ ! -d "$HOME/.gemini" ]; then
    echo "❌ Error: Gemini CLI authentication not found."
    echo "Please run the following commands to authenticate:"
    echo "  npm install -g @google/gemini-cli"
    echo "  gemini auth login"
    exit 1
fi

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/{repositories,logs,locks}

# Set directory permissions
chmod 755 data/
chmod 755 data/repositories data/logs data/locks

# Check configuration file
if [ ! -f "../service/config.yaml" ]; then
    echo "⚠️  Warning: Configuration file not found, using default configuration"
    if [ -f "../service/config.yaml.example" ]; then
        cp "../service/config.yaml.example" "../service/config.yaml"
        echo "✅ Copied example configuration file"
    fi
fi

# Stop existing containers if any
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 10

# Check service status
if docker-compose ps | grep -q "Up"; then
    echo "✅ Service started successfully!"
    echo ""
    echo "🌐 Service URL: http://localhost:8080"
    echo "🏥 Health Check: http://localhost:8080/health"
    echo ""
    echo "💡 Test API:"
    echo 'curl -X POST http://localhost:8080/api/v1/ask \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '"'"'{"repository_url": "https://github.com/octocat/Hello-World", "question": "What does this repository do?"}'"'"
    echo ""
    echo "📋 View logs: docker-compose logs -f"
    echo "🛑 Stop service: docker-compose down"
else
    echo "❌ Service failed to start. Please check logs:"
    docker-compose logs
    exit 1
fi 
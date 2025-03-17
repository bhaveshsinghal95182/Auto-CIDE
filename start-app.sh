#!/bin/bash

# Print banner
echo "========================================"
echo "  Starting Auto-CIDE Application"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop any existing containers with the same name
echo "Stopping any existing containers..."
docker-compose down

# Build and start the containers
echo "Building and starting the application..."
docker-compose up --build -d

# Check if containers are running
echo "Checking if containers are running..."
sleep 5
if [ "$(docker-compose ps -q | wc -l)" -gt 0 ]; then
    echo ""
    echo "========================================"
    echo "  Auto-CIDE is now running!"
    echo "  Backend API: http://localhost:5000"
    echo "========================================"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
else
    echo "Error: Containers failed to start. Check logs with: docker-compose logs"
    exit 1
fi 
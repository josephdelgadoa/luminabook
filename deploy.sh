#!/bin/bash
set -e

# Define variables
APP_NAME="luminabook-app"
IMAGE_NAME="luminabook"
PORT="8004"
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

API_KEY="$VITE_OPENROUTER_API_KEY"
if [ -z "$API_KEY" ]; then
  echo "Error: VITE_OPENROUTER_API_KEY not found in .env"
  exit 1
fi

echo "Starting deployment for $APP_NAME..."

# navigate to the directory where the script is located (project root)
cd "$(dirname "$0")"

# Pull latest changes
echo "Pulling latest changes from git..."
git pull origin main

# Build the Docker image
echo "Building Docker image..."
docker build --build-arg VITE_OPENROUTER_API_KEY="$API_KEY" -t $IMAGE_NAME .

# Remove any existing container (running or stopped)
echo "Removing existing container if it exists..."
docker rm -f $APP_NAME || true

# Run the new container
echo "Running new container on port $PORT..."
docker run -d \
  --name $APP_NAME \
  --restart always \
  -p $PORT:80 \
  -e VITE_OPENROUTER_API_KEY="$API_KEY" \
  $IMAGE_NAME

echo "Deployment complete!"

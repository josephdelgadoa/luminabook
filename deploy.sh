#!/bin/bash
set -e

# Define variables
APP_NAME="luminabook-app"
IMAGE_NAME="luminabook"
PORT="8004"
API_KEY="AIzaSyCOmB7VhqMqfZHgi9-77LmWN9czHsFptXs" # Adding API key explicitly for prod

echo "Starting deployment for $APP_NAME..."

# navigate to the directory where the script is located (project root)
cd "$(dirname "$0")"

# Pull latest changes
echo "Pulling latest changes from git..."
git pull origin main

# Build the Docker image
echo "Building Docker image..."
docker build --build-arg VITE_GEMINI_API_KEY="$API_KEY" -t $IMAGE_NAME .

# Remove any existing container (running or stopped)
echo "Removing existing container if it exists..."
docker rm -f $APP_NAME || true

# Run the new container
echo "Running new container on port $PORT..."
docker run -d \
  --name $APP_NAME \
  --restart always \
  -p $PORT:80 \
  -e VITE_GEMINI_API_KEY="$API_KEY" \
  $IMAGE_NAME

echo "Deployment complete!"

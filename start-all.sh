#!/bin/bash

# Function to kill child processes on exit
trap 'kill $(jobs -p)' EXIT

echo "Starting Security Demo Projects..."

# Start Service (Weather API)
echo "Starting Service on port 3010..."
cd Service
npm start &
SERVICE_PID=$!
cd ..

# Start IdP
echo "Starting IdP on port 3000..."
cd IdP
npm start &
IDP_PID=$!
cd ..

# Start App-1
echo "Starting App-1 on port 3030..."
cd App-1
npm start &
APP1_PID=$!
cd ..

# Start App-2
echo "Starting App-2 on port 3031..."
cd App-2
npm start &
APP2_PID=$!
cd ..

# Wait for all background processes
wait

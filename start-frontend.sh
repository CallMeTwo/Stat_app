#!/bin/bash

# Start Frontend Server
cd "$(dirname "$0")/frontend"

echo "Starting Stats React Frontend..."
echo ""
echo "Frontend will run on:"
echo "  - http://localhost:5173 (local)"
echo "  - http://172.29.28.157:5173 (network)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev

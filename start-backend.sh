#!/bin/bash

# Start Backend Server
cd "$(dirname "$0")/backend"

# Activate virtual environment
source venv/bin/activate

# Load environment variables
if [ -f ".env.local" ]; then
  export $(cat .env.local | grep -v '#' | xargs)
fi

echo "Starting Stats React Backend..."
echo "Server will run on http://172.29.28.157:5000"
echo ""
echo "Available endpoints:"
echo "  - http://172.29.28.157:5000/api/health"
echo "  - http://172.29.28.157:5000/api/upload"
echo "  - http://172.29.28.157:5000/api/analyze"
echo ""

uvicorn app:app --host 0.0.0.0 --port 5000 --reload

#!/bin/bash

# Test API endpoints directly

echo "================================"
echo "Testing Stats React API"
echo "================================"
echo ""

# Test health endpoint
echo "1. Testing /api/health endpoint:"
curl -v http://172.29.28.157:5000/api/health
echo ""
echo ""

# Test file upload with sample data
echo "2. Testing /api/upload endpoint with small_dataset.csv:"
if [ -f "sample_data/small_dataset.csv" ]; then
    curl -v -F "file=@sample_data/small_dataset.csv" http://172.29.28.157:5000/api/upload
else
    echo "Error: sample_data/small_dataset.csv not found"
fi
echo ""
echo ""

echo "================================"
echo "Test Complete"
echo "================================"

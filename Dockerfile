# Use Python 3.11 (compatible with pandas, numpy, scipy)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for building Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (for better caching)
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --prefer-binary -r backend/requirements.txt

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci --only=production

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Copy backend source
WORKDIR /app
COPY backend/ ./backend/

# Copy sample data
COPY sample_data/ ./sample_data/

# Expose port (Render will provide $PORT)
EXPOSE 5000

# Start uvicorn server
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-5000}"]

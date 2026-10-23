# Multi-stage Dockerfile for Inkloom AI Backend Service
FROM python:3.11-slim as backend

WORKDIR /workspace/backend

# Install system dependencies for build and optional media extractors
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and contracts
COPY backend/ ./
COPY contracts/ /workspace/contracts/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

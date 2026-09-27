# ======================================================
#  Backend Dockerfile — FastAPI (Development)
# ======================================================
FROM python:3.11-slim

# System deps: Tesseract OCR + libpq for PostgreSQL
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libpq-dev \
    gcc \
    poppler-utils \
    libmagic1 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Force Python requests to use the system's CA trust store instead of 'certifi'
# This ensures enterprise/corporate proxy certificates added to the OS are respected.
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

EXPOSE 8000

# Development: hot-reload with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

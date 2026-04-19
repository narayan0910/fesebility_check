FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder
COPY backend/ .

# Expose port (FastAPI defaults to 8000 or use environment)
EXPOSE 8000

# Run the application
CMD ["python", "main.py"]

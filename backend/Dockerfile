# Use the official Python image
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install system dependencies for Postgres
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port (Cloud Run sets this env var, default 8080)
ENV PORT=8080

# Command to run the application using Gunicorn
# app:app refers to 'app.py' file and 'app' flask instance
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app

# ==============================================================================
# Multi-Stage Hardened Dockerfile for Volcano Backend
# Targets: Google Cloud Run / Enterprise Kubernetes
# ==============================================================================

# --- Stage 1: Build & Dependency Compilation ---
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build dependencies for compiling psycopg2 and C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create standalone virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install all dependencies (including transitive ones like alembic)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- Stage 2: Minimal Non-Root Runtime ---
FROM python:3.12-slim AS runner

# Create non-privileged service user and group
ENV USER=volcano
ENV UID=10001
ENV GID=10001
RUN groupadd -g ${GID} ${USER} && \
    useradd -u ${UID} -g ${GID} -s /bin/bash -m ${USER}

WORKDIR /app

# Install runtime library for PostgreSQL without dev headers or compiler
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy complete virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application source code
COPY --chown=${USER}:${USER} . .

# Ensure app directories are owned by non-root user
RUN chown -R ${USER}:${USER} /app

# Switch to non-root execution
USER ${UID}:${GID}

# Cloud Run injects PORT environment variable (default: 8080)
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE ${PORT}

# Gunicorn production execution with signal trapping
CMD exec gunicorn --bind :$PORT --workers 2 --threads 4 --timeout 120 --access-logfile - --error-logfile - app:app

# ============================================================
# MoA Conference Portal — Backend Dockerfile
# Multi-stage build for a lean production image
# ============================================================

# ---------- Stage 1: Builder ----------
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build-time OS deps for psycopg2
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# ✅ FIXED: use --target instead of --prefix
# --prefix puts scripts in /install/bin which won't be on PATH in runtime.
# --target puts everything flat in /install so PYTHONPATH picks it up cleanly.
RUN pip install --no-cache-dir --prefix=/install  -r requirements.txt

# ---------- Stage 2: Runtime ----------
FROM python:3.12-slim

WORKDIR /app

# ✅ FIXED: added curl for the compose healthcheck
# curl is needed by: docker-compose healthcheck → curl http://localhost:8000/api/health/
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local
# Copy project source
COPY . .

# ✅ FIXED: create media dir and set ownership BEFORE switching to appuser
# The media volume is mounted as root at runtime — appuser needs write access
# to save uploaded files (paper submissions, profile photos, etc.)
RUN adduser --disabled-password appuser && \
    mkdir -p /app/media /app/staticfiles && \
    chown -R appuser:appuser /app/media /app/staticfiles

# ✅ REMOVED: collectstatic from build time
# Reason: it's already in docker-compose command: python manage.py collectstatic --no-input
# Running it here with a fake SECRET_KEY is redundant and can hide real errors.
# Let it run at container startup where real env vars are available.

USER appuser

EXPOSE 8000

CMD ["gunicorn", "conference_backend.wsgi:application", \
    "--bind", "0.0.0.0:8000", \
    "--workers", "3", \
    "--timeout", "120", \
    "--access-logfile", "-", \
    "--error-logfile", "-"]
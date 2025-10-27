# ============================================================================
# OPTIMIZED DOCKERFILE FOR RECONCILIATION PLATFORM
# ============================================================================
# Multi-stage build optimized for production
# Build: docker build -t reconciliation-platform .
# ============================================================================

# Stage 1: Backend Builder
FROM rust:1.75-alpine AS backend-builder

WORKDIR /app/backend

# Install build dependencies
RUN apk add --no-cache \
    musl-dev \
    pkgconfig \
    openssl-dev \
    openssl-libs-static \
    postgresql-dev \
    postgresql-libs

# Copy dependency manifests
COPY backend/Cargo.toml backend/Cargo.lock ./

# Create dummy src for dependency caching
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs

# Build dependencies
RUN cargo build --release && \
    rm -rf src

# Copy source and build application
COPY backend/src ./src
COPY backend/migrations ./migrations
RUN cargo build --release

# Stage 2: Frontend Builder
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Copy source and build
COPY frontend/ ./
RUN npm run build

# Stage 3: Production Runtime
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    libssl3 \
    libcrypto3 \
    libpq \
    nginx \
    curl \
    tzdata

# Create app directories
WORKDIR /app
RUN mkdir -p /app/uploads /app/logs

# Copy backend binary
COPY --from=backend-builder /app/backend/target/release/reconciliation-backend /app/reconciliation-backend
COPY --from=backend-builder /app/backend/migrations /app/migrations

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Configure nginx
COPY infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx &' >> /app/start.sh && \
    echo 'exec /app/reconciliation-backend' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 80 2000

CMD ["/app/start.sh"]


# Dockerfile for Oracle backup service
# Multi‑arch build (linux/arm64) using Docker buildx
FROM node:20-bookworm-slim AS base

# Install Chromium dependencies for Puppeteer (if needed)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY . .

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Healthcheck to ensure container is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Resource limits are set at runtime (Docker/K8s) – documented in README

# Entrypoint runs the custom entrypoint script
ENTRYPOINT ["node","backend/node-entrypoint.ts"]

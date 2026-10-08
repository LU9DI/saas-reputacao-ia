# API Filtra.IA — slim (sem g++/python: bcryptjs puro JS)
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --omit=dev --no-audit --no-fund \
  && npm cache clean --force && apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

  # Healthcheck to verify the API is alive
  HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
    CMD curl -f http://localhost:5000/api/health || exit 1

  # Custom entrypoint that validates env before starting
  ENTRYPOINT ["node","backend/node-entrypoint.ts"]

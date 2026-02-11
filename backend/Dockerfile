# Backend Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema first
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm install --save-dev typescript @types/node ts-node-dev && \
    npx tsc

# Expose port
EXPOSE 8002

# Create entrypoint script
RUN echo '#!/bin/sh' > /app/docker-entrypoint.sh && \
    echo 'echo "Waiting for database..."' >> /app/docker-entrypoint.sh && \
    echo 'sleep 5' >> /app/docker-entrypoint.sh && \
    echo 'echo "Running Prisma migrations..."' >> /app/docker-entrypoint.sh && \
    echo 'npx prisma migrate deploy' >> /app/docker-entrypoint.sh && \
    echo 'echo "Starting server..."' >> /app/docker-entrypoint.sh && \
    echo 'node dist/server.js' >> /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]

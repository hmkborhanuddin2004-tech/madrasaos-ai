# Multi-Stage Dockerfile for MadrasaOS AI v3.0 (Production-Grade)

# -----------------------------------------------------------------------------
# Stage 1: Build Frontend (Vite + React + TailwindCSS Kitabkhana)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS client-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY vite.config.ts tsconfig.json index.html ./
COPY client ./client
COPY server/src/types ./server/src/types

RUN npm run build:client

# -----------------------------------------------------------------------------
# Stage 2: Build Backend (Node.js + Express + TypeScript)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS server-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY server ./server

RUN npm run build:server

# -----------------------------------------------------------------------------
# Stage 3: Production Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled backend
COPY --from=server-builder /app/dist/server ./dist/server

# Copy compiled frontend assets for static serving
COPY --from=client-builder /app/dist/client ./dist/client

# Copy database migrations and seed scripts
COPY migrations ./migrations

# Create non-root system user and storage directories
RUN addgroup -S -g 1001 madrasaos && \
    adduser -S -u 1001 -G madrasaos madrasaos && \
    mkdir -p data uploads/exports logs && \
    chown -R madrasaos:madrasaos /app

USER madrasaos

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

CMD ["node", "dist/server/index.js"]

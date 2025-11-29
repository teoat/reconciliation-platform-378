# Better Auth Server Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY auth-server/package.json auth-server/package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY auth-server/ .

# Build TypeScript
RUN npm run build

# Production image, copy all the files and run
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 authserver

# Copy built application
COPY --from=builder --chown=authserver:nodejs /app/dist ./dist
COPY --from=builder --chown=authserver:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=authserver:nodejs /app/package.json ./package.json

USER authserver

EXPOSE 4000

ENV PORT 4000

CMD ["node", "dist/server.js"]


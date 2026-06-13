# ============================================================================
# Multi-stage build for Next.js application
# ============================================================================

FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# ============================================================================
# Dependencies stage
# ============================================================================

FROM base AS deps
RUN apk add --no-cache libc6-compat

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

# ============================================================================
# Builder stage
# ============================================================================

FROM base AS builder

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma client
RUN pnpm run prisma:generate

# Build Next.js app
RUN pnpm run build

# ============================================================================
# Runtime stage
# ============================================================================

FROM base AS runner

ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "server.js"]

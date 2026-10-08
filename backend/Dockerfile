# FLASH Backend — production Dockerfile
# Node 24 LTS + tsx runtime (no build step needed)

FROM node:24-alpine

# System deps
RUN apk add --no-cache tini

WORKDIR /app

# Install deps first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Source code + scripts
COPY src ./src
COPY scripts ./scripts
COPY tsconfig.json ./
COPY verify.ps1 ./

# Install tsx + typescript for runtime
RUN npm install --no-save tsx@4.19.2 typescript@5.6.3

# Run as non-root
RUN addgroup -S flash && adduser -S flash -G flash && chown -R flash:flash /app
USER flash

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Health check (liveness only — no DB)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:3000/health || exit 1

# tini = proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run directly via tsx
CMD ["npx", "tsx", "src/server.ts"]
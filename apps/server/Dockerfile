# Build context is the repository ROOT (see docker-compose.yml) so the
# workspace and the shared package are available.
FROM node:22-alpine
WORKDIR /app

# 1. Install dependencies (workspace-aware). Copy manifests first for caching.
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install

# 2. Copy sources needed by the server and the shared package.
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/server apps/server

# 3. Build the shared package and the server.
RUN npm run build -w @betterreviews/shared \
 && npm run build -w @betterreviews/server

EXPOSE 4000

# Apply schema + seed (both idempotent), then start the compiled server.
CMD ["sh", "-c", "npm run migrate -w @betterreviews/server && npm run seed -w @betterreviews/server && npm run start -w @betterreviews/server"]

# Build context is the repository ROOT (see docker-compose.yml).
# Runs the Vite dev server so env vars are read at runtime and the app works
# out of the box. For production, build a static bundle instead (see README).
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web

# The web client imports the shared package's built output.
RUN npm run build -w @betterreviews/shared

EXPOSE 5173

CMD ["npm", "run", "dev", "-w", "@betterreviews/web", "--", "--host", "--port", "5173"]

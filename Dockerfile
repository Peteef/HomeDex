# syntax=docker/dockerfile:1

# The Node image is pinned to its multi-arch index digest and written out in every FROM line,
# because Dependabot reads only literal FROM lines. It updates all three together.

# The built UI is the same on every platform, so this stage runs natively on the build machine
# instead of under emulation.
FROM --platform=$BUILDPLATFORM node:26-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1 AS web-build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY index.html vite.config.ts tsconfig.json ./
COPY scripts/app-version.ts ./scripts/
COPY public ./public
COPY src ./src
# The version the UI shows, set by CI. Without it the build has no git history, so it is 0.0.0-dev.
ARG APP_VERSION
RUN npm run build

# --ignore-scripts: better-sqlite3 ships prebuilt binaries for linux x64 and arm64, so nothing
# needs compiling, and the husky `prepare` script is a dev-only tool.
FROM node:26-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1 AS production-deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:26-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1 AS runtime
ENV NODE_ENV=production \
    DATA_DIR=/data \
    PORT=3000
WORKDIR /app
RUN mkdir -p /data && chown node:node /data
COPY --from=production-deps /app/node_modules ./node_modules
COPY package.json ./
COPY assets ./assets
COPY src ./src
COPY --from=web-build /app/dist/web ./dist/web
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT}/api/health`).then((res) => process.exit(res.ok ? 0 : 1), () => process.exit(1))"]
# Node runs as PID 1 (not through npm) so it receives SIGTERM and closes the database cleanly.
CMD ["node", "src/platform/backend/infrastructure/main.ts"]

# syntax=docker/dockerfile:1

# node:26-bookworm-slim, pinned to the multi-arch index digest. Update both together.
ARG NODE_IMAGE=node:26-bookworm-slim@sha256:add5c17c14752c54d2f3d519ec46a3815684d41c33f198bcb09fb998f7dcbf68

# The built UI is the same on every platform, so this stage runs natively on the build machine
# instead of under emulation.
FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS web-build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY index.html vite.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# --ignore-scripts: better-sqlite3 ships prebuilt binaries for linux x64 and arm64, so nothing
# needs compiling, and the husky `prepare` script is a dev-only tool.
FROM ${NODE_IMAGE} AS production-deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM ${NODE_IMAGE} AS runtime
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

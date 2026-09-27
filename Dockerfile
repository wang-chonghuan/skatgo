# Root Dockerfile. Render builds it from the repository root. The web app is a
# standalone project in app/ (its own package.json and lockfile); the repo root
# has no package.json.
FROM node:24-alpine AS build
WORKDIR /app
# Install from the app's own manifest + lockfile first, so a source-only change
# does not re-run npm ci. Context paths are repo-root relative.
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
# Render supplies PORT at runtime; 10000 is also the local container default.
ENV PORT=10000
COPY --from=build /app/.output ./.output
EXPOSE 10000
CMD ["node", ".output/server/index.mjs"]

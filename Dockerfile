# Root Dockerfile — the build context is the repo root, because that is what
# n-easyapp's `az acr build` uploads. The web app is a standalone project in app/
# (its own package.json and lockfile); the repo root has no package.json.
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
# n-easyapp's tanstack-start contract: port 3000, `node .output/server/index.mjs`.
ENV PORT=3000
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

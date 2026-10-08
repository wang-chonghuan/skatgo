# Debian slim, not alpine: onnxruntime-node's native library needs glibc (SKATGO-38).
FROM node:24-slim AS build
WORKDIR /repo/multiplayer
COPY multiplayer/package*.json ./
RUN npm ci
COPY multiplayer/ ./
COPY app/src/lib/skat/ /repo/app/src/lib/skat/
# A private table's admission ticket (SKATGO-61), shared with the web server.
COPY app/src/lib/room-ticket.ts /repo/app/src/lib/room-ticket.ts
RUN npm run build && npm prune --omit=dev
# A Linux image loads only onnxruntime's Linux builds; its Windows and macOS binaries are ~220 MB.
RUN rm -r node_modules/onnxruntime-node/bin/napi-v6/win32 node_modules/onnxruntime-node/bin/napi-v6/darwin

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
# onnxruntime's own telemetry stays off (SKATGO-38).
ENV ORT_DISABLE_TELEMETRY=1
COPY --from=build /repo/multiplayer/node_modules ./node_modules
COPY --from=build /repo/multiplayer/dist ./dist
COPY --from=build /repo/multiplayer/skatzero ./skatzero
USER node
EXPOSE 10000
CMD ["node", "dist/server.mjs"]

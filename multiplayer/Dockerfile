FROM node:24-alpine AS build
WORKDIR /repo/multiplayer
COPY multiplayer/package*.json ./
RUN npm ci
COPY multiplayer/ ./
COPY app/src/lib/skat/ /repo/app/src/lib/skat/
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
COPY --from=build /repo/multiplayer/node_modules ./node_modules
COPY --from=build /repo/multiplayer/dist ./dist
USER node
EXPOSE 10000
CMD ["node", "dist/server.mjs"]

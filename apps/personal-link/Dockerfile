FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim
WORKDIR /app
ARG APP_RELEASE=unknown
LABEL org.opencontainers.image.revision=${APP_RELEASE}
ENV NODE_ENV=production APP_RELEASE=${APP_RELEASE} PORT=3000
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=15s CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/readyz').then(res => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "dist/server/index.js"]

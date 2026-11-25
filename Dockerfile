FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_APP_RELEASE=unknown
ARG VITE_APP_ENV=production
ARG VITE_PERSONAL_LINK_ORIGIN
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_TRACES_SAMPLE_RATE=0
ARG VITE_GA_MEASUREMENT_ID
ARG VITE_META_PIXEL_ID
ARG VITE_PRIVACY_CONTACT_EMAIL
ARG VITE_OTEL_EXPORTER_OTLP_ENDPOINT
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ARG VITE_APP_RELEASE=unknown
LABEL org.opencontainers.image.revision=${VITE_APP_RELEASE}
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/scripts/serve.mjs ./scripts/serve.mjs
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/release.json').then(res => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "scripts/serve.mjs"]

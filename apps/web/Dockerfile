FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:3001/api/v1
ARG VITE_ENABLE_PREMIUM_BILLING=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ENABLE_PREMIUM_BILLING=$VITE_ENABLE_PREMIUM_BILLING

COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --workspace=@plant-care/web --include-workspace-root
COPY packages/shared ./packages/shared/
COPY apps/web ./apps/web/
RUN npm run build -w @plant-care/shared && npm run build -w @plant-care/web

FROM nginx:alpine
ARG APP_COMMIT_SHA=unknown
LABEL org.opencontainers.image.revision=$APP_COMMIT_SHA
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/web/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80

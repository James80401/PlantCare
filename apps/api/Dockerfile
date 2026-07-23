FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY prisma ./prisma/
RUN npm ci --workspace=@plant-care/api --include-workspace-root
COPY packages/shared ./packages/shared/
COPY apps/api ./apps/api/
RUN npm run build -w @plant-care/shared \
  && npx prisma generate --schema=prisma/postgresql/schema.prisma \
  && npm run build -w @plant-care/api

FROM node:22-alpine
ARG APP_COMMIT_SHA=unknown
LABEL org.opencontainers.image.revision=$APP_COMMIT_SHA
RUN apk add --no-cache wget
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
COPY --from=builder /app/packages/shared ./packages/shared/
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/apps/api/src/species ./apps/api/src/species
COPY --from=builder /app/apps/api/src/buddy ./apps/api/src/buddy
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/src/care-guides/photos ./apps/api/src/care-guides/photos
COPY --from=builder /app/apps/api/dist/care-guides ./apps/api/dist/care-guides

RUN sed -i 's/\r$//' apps/api/docker-entrypoint.sh && chmod +x apps/api/docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["sh", "apps/api/docker-entrypoint.sh"]

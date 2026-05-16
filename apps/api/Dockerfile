FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY prisma ./prisma/
RUN npm install --workspace=@plant-care/api --include-workspace-root
COPY packages/shared ./packages/shared/
COPY apps/api ./apps/api/
RUN npm run build -w @plant-care/shared && npx prisma generate && npm run build -w @plant-care/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/shared ./packages/shared/
COPY --from=builder /app/prisma ./prisma/
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]

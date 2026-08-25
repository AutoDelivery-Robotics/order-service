FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /usr/src/app

# Copy root configurations (if any)
# Assuming a monorepo setup or similar, copy package files first for caching
COPY backend/order-service/package.json backend/order-service/pnpm-lock.yaml* backend/order-service/
COPY shared/ shared/

WORKDIR /usr/src/app/backend/order-service
RUN pnpm install

# Now copy the rest of the source code
WORKDIR /usr/src/app
COPY backend/order-service/ backend/order-service/

# Build the shared library (if needed) and order-service
WORKDIR /usr/src/app/backend/order-service
RUN pnpm run build

FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/shared /usr/src/app/shared
COPY --from=builder /usr/src/app/backend/order-service/package.json /usr/src/app/backend/order-service/
COPY --from=builder /usr/src/app/backend/order-service/node_modules /usr/src/app/backend/order-service/node_modules
COPY --from=builder /usr/src/app/backend/order-service/dist /usr/src/app/backend/order-service/dist

WORKDIR /usr/src/app/backend/order-service

CMD ["node", "dist/main.js"]

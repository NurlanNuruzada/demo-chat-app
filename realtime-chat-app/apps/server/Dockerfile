# ======================
# Build stage
# ======================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/
COPY tsconfig.base.json ./

# Install dependencies (requires workspaces)
RUN npm install

# Copy source code
COPY apps/server ./apps/server
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build server
WORKDIR /app/apps/server
RUN npm run build

# ======================
# Production stage
# ======================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/

# Install production dependencies only
RUN npm install --omit=dev

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

EXPOSE 3001

WORKDIR /app/apps/server
CMD ["node", "dist/index.js"]

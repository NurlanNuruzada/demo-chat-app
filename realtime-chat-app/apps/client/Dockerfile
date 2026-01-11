# ======================
# Build stage
# ======================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package*.json ./
COPY apps/client/package*.json ./apps/client/
COPY packages/shared/package*.json ./packages/shared/
COPY tsconfig.base.json ./

# Install dependencies (requires workspaces)
RUN npm ci

# Copy source code
COPY apps/client ./apps/client
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build frontend
WORKDIR /app/apps/client
ARG VITE_SERVER_URL=http://localhost:3001
RUN VITE_SERVER_URL=$VITE_SERVER_URL npm run build

# ======================
# Production stage
# ======================
FROM nginx:alpine

# Copy built frontend
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

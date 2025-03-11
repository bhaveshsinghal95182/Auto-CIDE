# Build stage for Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
RUN npm install -g pnpm

# Copy frontend files
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ ./
RUN pnpm build

# Build stage for Backend
FROM node:20-slim AS backend-builder
WORKDIR /app/backend
RUN npm install -g pnpm

# Copy backend files
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY backend/ ./

# Final stage
FROM node:20-slim
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
COPY --from=frontend-builder /app/frontend/server.js /app/frontend/
COPY --from=frontend-builder /app/frontend/package.json /app/frontend/

# Copy backend from backend-builder
COPY --from=backend-builder /app/backend /app/backend

# Install production dependencies
WORKDIR /app/frontend
RUN pnpm install --prod

WORKDIR /app/backend
RUN pnpm install --prod

# Copy the startup script
COPY start.sh /app/
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 5000

# Set the working directory to the app root
WORKDIR /app

# Start both services
CMD ["/app/start.sh"] 
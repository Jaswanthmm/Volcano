# ==============================================================================
# Multi-Stage Hardened Dockerfile for Volcano Frontend
# Targets: Google Cloud Run / Nginx Non-Root
# ==============================================================================

# --- Stage 1: Build Static Assets ---
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --prefer-offline

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Stage 2: Lightweight Production Web Server ---
FROM nginx:alpine-slim AS runner

# Remove default nginx configurations
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy static assets and custom nginx configuration
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Setup non-root execution for Nginx on Cloud Run (port 8080)
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html /etc/nginx/conf.d

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

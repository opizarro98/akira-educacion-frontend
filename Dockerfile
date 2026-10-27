# syntax=docker/dockerfile:1

# ---- Build ----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /workspace

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime --------------------------------------------------------------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

# ====== BUILD ======
FROM node:20-bullseye AS build
WORKDIR /app

# Instaliraj deps
COPY package*.json ./
RUN npm ci

# Kopiraj app + .env i build-aj
COPY . .
ENV NODE_ENV=production
RUN npm run build

# ====== RUNTIME ======
FROM nginx:1.27-alpine
# Kopiraj build artefakte
COPY --from=build /app/dist/ /usr/share/nginx/html/
# SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# (opciono) non-root user; Nginx na Alpine koristi nginx user već
EXPOSE 80

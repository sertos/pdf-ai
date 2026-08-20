FROM node:20-alpine AS build
WORKDIR /app

# Instalar pnpm de forma global
RUN npm install -g pnpm

# Copiar manifiestos
COPY package*.json ./

# Instalar dependencias usando pnpm (resuelve los binarios opcionales para Linux automáticamente)
RUN pnpm install

# Copiar el resto del código
COPY . .

# Variables y Build
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN pnpm run build

# Etapa final Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
FROM node:18-slim AS build
WORKDIR /app

# Copiar manifiesto de dependencias
COPY package*.json ./

# Reemplazar 'npm ci' por 'npm install' para reconstruir binarios nativos de Linux
RUN npm install

# Copiar el código fuente
COPY . .

# Variables y Build
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN npm run build

# Etapa final Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
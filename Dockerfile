FROM node:18-slim AS build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Forzar la instalación de dependencias opcionales para la arquitectura Linux de Docker
RUN npm ci --os=linux --cpu=x64

# Copiar el resto del código
COPY . .

# Variables y Build
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN npm run build

# Etapa Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
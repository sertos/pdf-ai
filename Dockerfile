FROM node:18-slim AS build
WORKDIR /app

# Copiar manifiesto de dependencias
COPY package*.json ./

# Instalar dependencias y RECONSTRUIR binarios para el entorno de Linux
RUN npm install && npm rebuild

# Copiar el código fuente del proyecto
COPY . .

# Inyectar la API Key de Gemini
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Compilar la aplicación React/Vite
RUN npm run build

# Etapa final de producción con Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
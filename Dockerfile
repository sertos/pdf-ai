FROM node:18-slim AS build
WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias limpias directamente dentro del contenedor Linux
RUN npm ci

# Copiar el código fuente (asegúrate de tener el .dockerignore configurado)
COPY . .

# Inyectar la API Key de Gemini recibida desde Cloud Build
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Compilar el proyecto Vite
RUN npm run build

# Etapa final de producción con Nginx
FROM nginx:alpine

# Copiar el resultado del build estático
COPY --from=build /app/dist /usr/share/nginx/html

# Mapear Nginx al puerto 8080 que exige Cloud Run
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

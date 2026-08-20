FROM node:20-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Limpiar cache e instalar el binario nativo de Tailwind v4 para Alpine Linux (musl)
RUN npm install
RUN npm install @tailwindcss/oxide-linux-x64-musl

# Copiar el resto del código
COPY . .

# Variables y Build
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN npm run build

# Etapa final de producción con Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
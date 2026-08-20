FROM node:18-slim AS build
WORKDIR /app

# Copiar manifiesto de dependencias
COPY package*.json ./

# Forzar la instalación del binario específico para Linux de Tailwind v4
RUN npm install
RUN npm install @tailwindcss/oxide-linux-x64-gnu

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
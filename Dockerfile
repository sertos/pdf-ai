FROM node:20-slim AS build
WORKDIR /app

# 1. Copiamos TODO el proyecto primero
COPY . .

# 2. Eliminamos cualquier node_modules o package-lock.json de Windows que se haya colado
RUN rm -rf node_modules package-lock.json

# 3. Instalamos todo desde cero para que Node descargue los binarios puros de Linux
RUN npm install

# 4. Inyectamos la clave de Gemini
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# 5. Ejecutamos el build (ahora sí, con el entorno 100% Linux)
RUN npm run build

# Etapa final Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
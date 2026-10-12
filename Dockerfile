# 1. Etapa de Construcción (Build)
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Compilar la aplicación de Vite y TypeScript
RUN npm run build

# 2. Etapa Final de Ejecución (Node.js Express Server)
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
# Instalamos solo dependencias de producción para mantener el contenedor liviano
RUN npm install --only=production

# Copiamos la compilación del frontend y el archivo del servidor
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./
COPY --from=build /app/tsconfig.json ./

# Cloud Run utiliza por defecto la variable PORT (usualmente 8080)
EXPOSE 8080

# Ejecutamos el servidor backend con tsx o node
CMD ["npx", "tsx", "server.ts"]

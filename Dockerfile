
# 1. Etapa de construcción
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Compila el frontend y el servidor Express
RUN npm run build

# 2. Etapa de producción
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm install --omit=dev

# Copia el frontend y el servidor compilado
COPY --from=build /app/dist ./dist

EXPOSE 8080

# Ejecuta el servidor compilado
CMD ["npm", "start"]

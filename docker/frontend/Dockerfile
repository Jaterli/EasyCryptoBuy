# Dockerfile (para React)
# Etapa 1: Compilación
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de configuración y dependencias
COPY frontend/package.json frontend/yarn.lock* ./
RUN yarn install --frozen-lockfile

# Copiar el código fuente y compilar
COPY frontend/ .
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN yarn build

# Etapa 2: Servir con Nginx
FROM nginx:stable-alpine

# Copiar los archivos compilados desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html
# Si usas Create React App, la carpeta se llama 'build' en lugar de 'dist'

# Copiar una configuración personalizada de Nginx (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
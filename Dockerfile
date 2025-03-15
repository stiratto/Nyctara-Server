# Usa la versión LTS de Node.js
FROM node:lts

# Instala pnpm globalmente
RUN corepack enable && corepack prepare pnpm@latest --activate

# Crea y cambia al directorio de la app
WORKDIR /app

# Copia solo los archivos necesarios primero (mejora la caché de Docker)
COPY package.json pnpm-lock.yaml ./

# Instala dependencias con pnpm
RUN pnpm install --frozen-lockfile

# Copia el resto del código de la aplicación
COPY . ./

# Genera los clientes de Prisma
RUN pnpx prisma generate


# Compila la app (si es necesario)
RUN pnpm build

# Comando de inicio en producción
CMD ["pnpm", "start:prod"]


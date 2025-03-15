# Usa una imagen ligera de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos esenciales para instalar dependencias
COPY package.json pnpm-lock.yaml tsconfig.json ./

# Instala PNPM y dependencias
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Copia el resto del código
COPY . .

# Genera los clientes de Prisma
RUN pnpx prisma generate

# Reconstruye las dependencias que necesitan build scripts
RUN pnpm rebuild

# Compila TypeScript a JavaScript
RUN pnpm build

# Expone el puerto de la app (ajústalo según necesidad)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["pnpm", "start"]


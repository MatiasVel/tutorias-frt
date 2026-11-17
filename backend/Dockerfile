# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
# El esquema se copia antes de instalar: "postinstall" ejecuta "prisma generate"
COPY prisma ./prisma
RUN npm install
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---------- runtime ----------
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
# Usuario sin privilegios
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --chown=app:app package.json ./
USER app
EXPOSE 3000
# Aplica migraciones versionadas si existen; si no, sincroniza el esquema (primer arranque)
CMD ["sh", "-c", "if [ -d prisma/migrations ]; then npx prisma migrate deploy; else npx prisma db push --skip-generate; fi && node dist/main"]

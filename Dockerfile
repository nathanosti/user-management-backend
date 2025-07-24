# Multi-stage build para otimizar imagem
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat curl

# Definir diretório de trabalho
WORKDIR /app

# Stage para dependências
FROM base AS deps
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas as dependências (incluindo dev para build)
RUN npm ci

# Gerar Prisma Client
RUN npx prisma generate

# Stage para build
FROM base AS builder
WORKDIR /app

# Copiar dependências e código fonte
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build da aplicação
RUN npm run build

# Stage final - produção
FROM node:18-alpine AS production
WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Instalar curl para health check
RUN apk add --no-cache curl

# Copiar apenas arquivos necessários para produção
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Criar diretório para logs
RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001 || exit 1

# Comando para iniciar
CMD ["npm", "run", "start:prod"]

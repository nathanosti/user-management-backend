set -e

echo "Iniciando ambiente de desenvolvimento - Backend..."

if ! docker info >/dev/null 2>&1; then
  echo "Docker não está rodando. Por favor, inicie o Docker primeiro."
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "Criando arquivo .env a partir do .env.example..."
  cp .env.example .env
  echo "Arquivo .env criado. Verifique as configurações se necessário."
fi

echo "Iniciando PostgreSQL, Redis e ferramentas de desenvolvimento..."
docker-compose -f docker-compose.dev.yml up -d

echo "Aguardando serviços estarem prontos..."

wait_for_service() {
  local service=$1
  local max_attempts=30
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    if docker-compose -f docker-compose.dev.yml exec -T $service echo "ready" >/dev/null 2>&1; then
      echo "$service está pronto!"
      return 0
    fi
    echo "Aguardando $service... ($attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
  done

  echo "Timeout aguardando $service"
  return 1
}

echo "Aguardando PostgreSQL..."
timeout=60
counter=0
until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do
  counter=$((counter + 1))
  if [ $counter -gt $timeout ]; then
    echo "Timeout: PostgreSQL não está respondendo"
    exit 1
  fi
  sleep 1
done

echo "Aguardando Redis..."
until docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping >/dev/null 2>&1; do
  counter=$((counter + 1))
  if [ $counter -gt $timeout ]; then
    echo "Timeout: Redis não está respondendo"
    exit 1
  fi
  sleep 1
done

if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm install
fi

echo "Gerando Prisma client..."
npx prisma generate

echo "Executando migrações do banco..."
npx prisma migrate dev --name init || echo "⚠️ Migrações já existem ou falharam"

read -p "Deseja popular o banco com dados de exemplo? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Populando banco com dados de exemplo..."
  npx prisma db seed || echo "Seed falhou ou já foi executado"
fi

echo ""
echo "Ambiente de desenvolvimento configurado!"
echo ""
echo "Serviços disponíveis:"
echo "PostgreSQL: localhost:5432"
echo "Redis: localhost:6379"
echo "Adminer (DB Interface): http://localhost:8080"
echo "  - Sistema: PostgreSQL"
echo "  - Servidor: postgres"
echo "  - Usuário: postgres"
echo "  - Senha: postgres"
echo "  - Base de dados: user_management"
echo "• Redis Commander: http://localhost:8081"
echo "  - Usuário: admin"
echo "  - Senha: admin"
echo ""
echo "Para iniciar o backend execute:"
echo "npm run start:dev"

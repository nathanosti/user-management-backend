set -e

echo "🚀 Iniciando ambiente de produção - Backend..."

if ! docker info >/dev/null 2>&1; then
  echo "Docker não está rodando. Por favor, inicie o Docker primeiro."
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "Arquivo .env não encontrado!"
  echo "Criando a partir do .env.example..."
  cp .env.example .env
  echo "IMPORTANTE: Configure o arquivo .env com valores de produção!"
  echo "Especialmente altere JWT_SECRET para um valor seguro!"
  read -p "Pressione Enter após configurar o .env..."
fi

echo "Fazendo build das imagens..."
docker-compose build --no-cache backend

echo "Iniciando aplicação completa..."
docker-compose up -d

echo "Aguardando aplicação estar saudável..."
timeout=120
counter=0

while [ $counter -lt $timeout ]; do
  if curl -f http://localhost:3001 >/dev/null 2>&1; then
    echo "Backend está respondendo!"
    break
  fi
  counter=$((counter + 1))
  echo "Aguardando backend... ($counter/$timeout)"
  sleep 2
done

if [ $counter -eq $timeout ]; then
  echo "Timeout: Backend não respondeu a tempo"
  echo "Verifique os logs com: docker-compose logs backend"
  exit 1
fi

echo ""
echo "Aplicação de produção iniciada!"
echo ""
echo "Serviços disponíveis:"
echo "• Backend API: http://localhost:3001"
echo "• API Documentation: http://localhost:3001/api/docs"
echo "• Health Check: http://localhost:3001/health"
echo ""
echo "Para ver logs execute:"
echo "docker-compose logs -f"

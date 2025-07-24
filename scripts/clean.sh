echo "Limpando ambiente..."

read -p "Isso vai remover containers, volumes e dados. Continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operação cancelada."
  exit 1
fi

docker-compose down -v --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true

echo "Removendo imagens do projeto..."
docker rmi $(docker images -q "*user*management*" 2>/dev/null) 2>/dev/null || echo "Nenhuma imagem do projeto encontrada"

read -p "Limpar sistema Docker completo? (remove imagens não usadas) (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  docker system prune -f
  echo "Sistema Docker limpo!"
fi

echo "Limpeza concluída!"

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
  echo "Mostrando logs de todos os serviços..."
  echo "Use: ./scripts/logs.sh <service> para logs específicos"
  echo "Serviços disponíveis: backend, postgres, redis"
  echo ""
  docker-compose logs -f --tail=50
else
  echo "Mostrando logs do serviço: $SERVICE"
  docker-compose logs -f --tail=100 $SERVICE
fi

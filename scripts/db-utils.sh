COMMAND=${1:-"help"}

case $COMMAND in
"migrate")
  echo "Executando migrações..."
  npx prisma migrate dev
  ;;
"seed")
  echo "Populando banco com dados de exemplo..."
  npx prisma db seed
  ;;
"reset")
  echo "CUIDADO: Isso vai apagar todos os dados!"
  read -p "Tem certeza? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Resetando banco de dados..."
    npx prisma migrate reset --force
  else
    echo "Operação cancelada."
  fi
  ;;
"studio")
  echo "Abrindo Prisma Studio..."
  npx prisma studio
  ;;
"generate")
  echo "Gerando Prisma client..."
  npx prisma generate
  ;;
"status")
  echo "Status das migrações..."
  npx prisma migrate status
  ;;
*)
  echo "Utilitários do Banco de Dados"
  echo ""
  echo "Comandos disponíveis:"
  echo "  migrate  - Executar migrações"
  echo "  seed     - Popular com dados de exemplo"
  echo "  reset    - Resetar banco (CUIDADO!)"
  echo "  studio   - Abrir Prisma Studio"
  echo "  generate - Gerar Prisma client"
  echo "  status   - Ver status das migrações"
  echo ""
  echo "Uso: ./scripts/db-utils.sh <comando>"
  ;;
esac

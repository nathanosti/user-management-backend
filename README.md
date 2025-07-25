# 🧠 API Backend - Sistema de Autenticação e Gerenciamento

Este projeto é uma API desenvolvida com **NestJS**, **PostgreSQL**, **Redis** e containerização com **Docker**. Ela inclui autenticação JWT com criptografia, cache com Redis, e gerenciamento de usuários.

---

## Tecnologias Utilizadas

- [NestJS](https://nestjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [Prisma ORM](https://www.prisma.io/)
- [Docker](https://www.docker.com/)
- [JWT](https://jwt.io/) com **criptografia AES-256**
- [Winston](https://github.com/winstonjs/winston) para logs estruturados

---

## Requisitos

| Requisito           | Versão mínima recomendada             |
| ------------------- | ------------------------------------- |
| Node.js             | 18.x ou superior                      |
| Docker              | 20.x ou superior                      |
| Docker Compose      | 2.x ou superior                       |
| Sistema Operacional | Linux, macOS, WSL2 (Windows via WSL2) |

---

## Instalação do Projeto

1. **Clone o repositório**

```bash
git clone https://github.comnathanosti/user-management-backend.git
cd user-management-backend
```

2. **Instale as dependências**

```bash
npm install
```

---

## Subindo o ambiente com Docker

Antes de iniciar a API, suba os serviços de **PostgreSQL** e **Redis** com o seguinte comando:

```bash
npm run docker:dev
```

Este comando executa:

- Containers definidos em `docker-compose.yml` e `docker-compose.dev.yml`
- Criação do banco via `init-db.sql`
- Inicialização do Redis

> Os dados de conexão são definidos via `.env`.

---

## Iniciando o servidor em modo de desenvolvimento

Com os containers já rodando, inicie a API com:

```bash
npm run start:dev
```

Isso inicia a aplicação com hot-reload via `ts-node-dev`.

---

## ⚙️ Variáveis de Ambiente (.env)

Crie um `.env` com o seguinte:

```env
DATABASE_URL=

REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

PORT=
NODE_ENV=

JWT_SECRET=
JWT_ENCRYPTION_SECRET=
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=

LOG_LEVEL=

CORS_ORIGIN=
```

> ⚠️ `JWT_ENCRYPTION_SECRET` deve ter exatamente 32 caracteres.

---

## Scripts disponíveis

| Comando                   | Ação                                                 |
| ------------------------- | ---------------------------------------------------- |
| `npm run docker:dev`      | Sobe Redis + PostgreSQL e aplica `init-db.sql`       |
| `npm run start:dev`       | Inicia a API local com hot reload                    |
| `sh scripts/clean.sh`     | Remove volumes, containers e redes Docker            |
| `sh scripts/logs.sh`      | Mostra os logs em tempo real dos containers          |
| `sh scripts/dev-start.sh` | Roda a API local lendo `.env` e conectando ao Docker |

---

## Fluxo de autenticação JWT criptografado

- O backend **gera tokens JWT normais**, mas os **criptografa com AES-256-CBC** antes de enviar ao frontend.
- O frontend **não consegue decodificar** o token via jwt.io.
- O backend **decripta** e **valida o hash SHA-256** no Redis para garantir autenticidade.

---

## Exemplo de login

**Request:**

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "admin@sistema.com",
  "password": "senha123*"
}
```

**Response:**

```json
{
  "message": "Login successful"
}
```

> ⚠️ Tokens sao salvos via cookies!!.

---

## Testando conexões e logs

```bash
sh scripts/logs.sh
```

---

## Limpando tudo

```bash
sh scripts/clean.sh
```

---

## Documentação Swagger

Disponível em:

```
http://localhost:3001/api/docs
```

---

## Compatibilidade

Testado em:

- ✅ Linux (Ubuntu, Arch, Fedora)
- ✅ macOS (Intel / Apple Silicon)
- ✅ Windows via WSL2 com Docker Desktop

---

## Autor

## Desenvolvido por [Nathan Osti Miguel](https://www.linkedin.com/in/nathanosti/)

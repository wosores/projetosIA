# Fio & Afeto — E-commerce de Produtos Artesanais

Aplicação web de e-commerce para venda de produtos artesanais de costura — bolsas, decoração, roupinhas infantis, kits e presentes — com front-end em HTML, CSS e JavaScript puro, API em Node.js/Express e banco de dados PostgreSQL.

## Stack

- **Front-end:** HTML5, CSS3 e JavaScript (ES6+)
- **Back-end:** Node.js + Express
- **Banco de dados:** PostgreSQL
- **Autenticação:** JWT em cookie `httpOnly`
- **Senhas:** hash com `bcryptjs`
- **Deploy:** Ubuntu Server 24.04 LTS (com PM2 em produção)

## Estrutura

```text
fio-e-afeto/
├── AGENTS.md
├── README.md
├── package.json
├── server.js
├── database/
│   ├── schema.sql
│   └── reset-catalogo.sql
└── public/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── main.js
    │   ├── auth.js
    │   └── conta.js
    ├── index.html
    ├── login.html
    └── conta.html
```

## Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 12 ou superior

## Configuração

1. Crie o banco de dados `ecommercedb`:

   ```bash
   createdb ecommercedb
   ```

   Ou, no `psql`:

   ```sql
   CREATE DATABASE ecommercedb;
   ```

2. Execute o schema (cria as tabelas e insere os produtos de exemplo):

   ```bash
   psql -U postgres -d ecommercedb -f database/schema.sql
   ```

   O seed é idempotente: rodar o script novamente não duplica os produtos.

   Para recriar o catálogo de demonstração em um banco que já possui produtos, execute:

   ```bash
   psql -U postgres -d ecommercedb -f database/reset-catalogo.sql
   ```

   > O reset apaga produtos, pedidos e itens de pedidos existentes. Os usuários são preservados. Use apenas antes de abrir a loja ou em ambiente de desenvolvimento.

3. Instale as dependências:

   ```bash
   npm install
   ```

4. Crie um arquivo `.env` na raiz do projeto:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=sua_senha
   DB_NAME=ecommercedb
   DB_PORT=5432
   JWT_SECRET=uma-chave-longa-e-aleatoria
   NODE_ENV=development
   ```

   | Variável | Obrigatória | Descrição |
   | --- | --- | --- |
   | `PORT` | Sim | Porta HTTP do Express (padrão: `3000`) |
   | `DB_HOST` | Sim | Host do PostgreSQL (padrão: `localhost`) |
   | `DB_USER` | Sim | Usuário do PostgreSQL (padrão: `postgres`) |
   | `DB_PASSWORD` | Sim | Senha do usuário do banco |
   | `DB_NAME` | Sim | Nome do banco (padrão: `ecommercedb`) |
   | `DB_PORT` | Sim | Porta do PostgreSQL (padrão: `5432`) |
   | `JWT_SECRET` | Sim em produção | Segredo usado para assinar os tokens JWT |
   | `NODE_ENV` | Não | Use `production` no servidor |
   | `DB_SSL` | Não | Defina `true` para conexões PostgreSQL com SSL |
   | `DATABASE_URL` | Não | Alternativa opcional às variáveis `DB_*` |

   O `server.js` carrega o `.env` explicitamente a partir da raiz do projeto, inclusive quando iniciado pelo PM2.

5. Inicie o servidor:

   ```bash
   npm start
   # ou, em desenvolvimento:
   npm run dev
   ```

6. Acesse:

   - Loja: <http://localhost:3000>
   - Login/cadastro: <http://localhost:3000/login.html>
   - Minha conta: <http://localhost:3000/conta.html>

Após o login ou cadastro, o usuário é redirecionado para `conta.html`, que consulta `GET /api/auth/me` e exibe seus dados.

### Produção com PM2

```bash
npm install -g pm2
pm2 start server.js --name fioafeto
pm2 save
pm2 startup
```

## API

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/products` | Lista os produtos (filtros opcionais `categoria`, `busca` e `limite`) |
| `POST` | `/api/auth/register` | Cadastra um usuário (`nome`, `email`, `senha`) |
| `POST` | `/api/auth/login` | Autentica (`email`, `senha`, `lembrar`) e define o cookie JWT |
| `POST` | `/api/auth/logout` | Encerra a sessão |
| `GET` | `/api/auth/me` | Retorna o usuário autenticado |

## Observações

- `JWT_SECRET` é obrigatório quando `NODE_ENV=production`.
- O cookie de autenticação é `httpOnly` e usa `SameSite=Lax`.
- As imagens dos produtos são carregadas de URLs externas (Unsplash); é necessário acesso à internet para exibi-las.
- Em produção, utilize HTTPS para que o cookie `Secure` funcione corretamente.

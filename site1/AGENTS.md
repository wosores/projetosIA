# Visão Geral do Projeto: E-commerce de Produtos Artesanais

Este projeto consiste no desenvolvimento de uma aplicação web completa (E-commerce) para venda de produtos artesanais de costura, como bolsas, peças de decoração, roupinhas infantis, kits e presentes. O objetivo é fornecer uma interface moderna, acolhedora e intuitiva para os clientes, além de um sistema seguro de autenticação e gerenciamento de dados.

---

## 🛠️ Pilha Tecnológica (Tech Stack)

- **Front-end:** HTML5 semântico, CSS3 (com Flexbox/Grid para layout responsivo) e JavaScript puro (Vanilla JS / ES6+).
- **Back-end / API:** Node.js com Express (para integrar o HTML/JS ao banco de dados).
- **Banco de Dados:** PostgreSQL (armazenamento de usuários, produtos e pedidos).
- **Autenticação:** Sessões baseadas em JWT (JSON Web Tokens) ou cookies seguros.

---

## 📂 Estrutura de Arquivos Pretendida

```text
fio-e-afeto/
├── AGENTS.md               # Instruções para o agente OpenCode
├── package.json            # Dependências do Node.js/Express e PostgreSQL
├── server.js               # Servidor principal da API e rotas
├── database/
│   ├── schema.sql          # Scripts SQL para criação das tabelas no PostgreSQL
│   └── reset-catalogo.sql  # Recria o catálogo artesanal de demonstração
├── public/
│   ├── css/
│   │   └── style.css       # Estilos globais
│   ├── js/
│   │   ├── main.js         # Lógica da tela inicial e dinamismo
│   │   ├── auth.js         # Lógica do formulário de login e cadastro
│   │   └── conta.js        # Lógica da página da conta
│   ├── index.html          # Tela Inicial (vitrine artesanal, destaques, footer)
│   ├── login.html          # Tela de Login e Cadastro de Usuário
│   └── conta.html          # Área do cliente autenticado
└── README.md               # Documentação para execução local

## 🚀 Ambiente de Deploy e Servidor (Ubuntu 24.04 LTS)
- **Servidor:** Ubuntu Server 24.04 LTS
- **Gerenciador de Processos:** Node.js (com suporte a PM2 em produção)
- **Banco de Dados:** PostgreSQL (`ecommercedb`) rodando localmente na porta `5432`.
- **Variáveis de Ambiente Obrigatórias (`.env`):**
  - `PORT` (ex: 3000)
  - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`

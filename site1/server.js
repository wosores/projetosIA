// Servidor principal do E-commerce de produtos artesanais
const path = require('path');

// Carrega o .env a partir da raiz do projeto, mesmo quando iniciado via PM2
// ou de outro diretório de trabalho.
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fioafeto-dev-secret-altere-em-producao';
const COOKIE_NAME = 'fioafeto_token';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET é obrigatório quando NODE_ENV=production.');
  }
  console.warn('Aviso: JWT_SECRET não definido. Usando segredo de desenvolvimento.');
}

// ---------------------------------------------------------------------------
// Configuração do Express
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Conexão com o PostgreSQL
// ---------------------------------------------------------------------------
// Padrão definido no AGENTS.md (Ubuntu 24.04): DB_HOST, DB_USER, DB_PASSWORD,
// DB_NAME e DB_PORT. DATABASE_URL continua aceito como alternativa opcional.
const usaDatabaseUrl = Boolean(process.env.DATABASE_URL);
const usarSSL = process.env.DB_SSL === 'true';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommercedb',
  ssl: usarSSL ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(
  usaDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: usarSSL ? { rejectUnauthorized: false } : false,
      }
    : dbConfig
);

if (usaDatabaseUrl) {
  console.log('PostgreSQL configurado via DATABASE_URL.');
} else {
  console.log(
    `PostgreSQL configurado: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`
  );
}

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err.message);
});

// Consultas parametrizadas (evita SQL injection)
async function query(text, params) {
  return pool.query(text, params);
}

// ---------------------------------------------------------------------------
// Helpers de autenticação
// ---------------------------------------------------------------------------
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function opcoesCookie(lembrar = false) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(lembrar ? { maxAge: TOKEN_MAX_AGE } : {}),
  };
}

function gerarToken(usuario) {
  return jwt.sign({ sub: usuario.id }, JWT_SECRET, { expiresIn: '7d' });
}

function extrairToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }

  const autorizacao = req.headers.authorization;
  if (autorizacao && autorizacao.startsWith('Bearer ')) {
    return autorizacao.slice(7).trim();
  }

  return null;
}

// ---------------------------------------------------------------------------
// Rotas da API
// ---------------------------------------------------------------------------
// Lista de produtos da vitrine (aceita filtros opcionais)
app.get(
  '/api/products',
  asyncHandler(async (req, res) => {
    const { categoria, busca, limite } = req.query;
    const condicoes = [];
    const valores = [];

    if (typeof categoria === 'string' && categoria.trim()) {
      valores.push(categoria.trim());
      condicoes.push(`categoria = $${valores.length}`);
    }

    if (typeof busca === 'string' && busca.trim()) {
      valores.push(`%${busca.trim()}%`);
      condicoes.push(
        `(nome ILIKE $${valores.length} OR descricao ILIKE $${valores.length})`
      );
    }

    let sql = `
      SELECT id, nome, descricao, preco, categoria, imagem_url, estoque
      FROM products
    `;

    if (condicoes.length > 0) {
      sql += ` WHERE ${condicoes.join(' AND ')}`;
    }

    sql += ' ORDER BY id ASC';

    const limiteNum = Number.parseInt(limite, 10);
    if (Number.isInteger(limiteNum) && limiteNum > 0) {
      valores.push(Math.min(limiteNum, 50));
      sql += ` LIMIT $${valores.length}`;
    }

    const { rows } = await query(sql, valores);
    res.json({ produtos: rows });
  })
);

// Cadastro de usuário
app.post(
  '/api/auth/register',
  asyncHandler(async (req, res) => {
    const corpo = req.body || {};
    const nome = String(corpo.nome || '').trim();
    const email = String(corpo.email || '').trim().toLowerCase();
    const senha = String(corpo.senha || '');

    if (nome.length < 3) {
      return res.status(400).json({ erro: 'Informe seu nome completo.' });
    }

    if (nome.length > 255) {
      return res.status(400).json({ erro: 'O nome deve ter no máximo 255 caracteres.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    }

    if (email.length > 255) {
      return res.status(400).json({ erro: 'O e-mail deve ter no máximo 255 caracteres.' });
    }

    if (senha.length < 6) {
      return res
        .status(400)
        .json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const existente = await query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);

    if (existente.rowCount > 0) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    let usuario;
    try {
      const { rows } = await query(
        `INSERT INTO users (nome, email, senha)
         VALUES ($1, $2, $3)
         RETURNING id, nome, email, criado_em`,
        [nome, email, senhaHash]
      );
      usuario = rows[0];
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
      }
      throw err;
    }

    const token = gerarToken(usuario);
    res.cookie(COOKIE_NAME, token, opcoesCookie(true));

    return res.status(201).json({
      mensagem: 'Conta criada com sucesso.',
      usuario,
    });
  })
);

// Login
app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const corpo = req.body || {};
    const email = String(corpo.email || '').trim().toLowerCase();
    const senha = String(corpo.senha || '');
    const lembrar = Boolean(corpo.lembrar);

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    }

    const { rows } = await query(
      'SELECT id, nome, email, senha, criado_em FROM users WHERE email = $1',
      [email]
    );

    const usuario = rows[0];
    const senhaValida = usuario
      ? await bcrypt.compare(senha, usuario.senha)
      : false;

    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const token = gerarToken(usuario);
    res.cookie(COOKIE_NAME, token, opcoesCookie(lembrar));

    delete usuario.senha;

    return res.json({
      mensagem: 'Login realizado com sucesso.',
      usuario,
    });
  })
);

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, opcoesCookie());
  res.json({ mensagem: 'Sessão encerrada.' });
});

// Usuário autenticado
app.get(
  '/api/auth/me',
  asyncHandler(async (req, res) => {
    const token = extrairToken(req);

    if (!token) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
    }

    const { rows } = await query(
      'SELECT id, nome, email, criado_em FROM users WHERE id = $1',
      [payload.sub]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }

    return res.json({ usuario: rows[0] });
  })
);

// 404 para rotas de API não encontradas
app.use('/api', (req, res) => {
  res.status(404).json({ erro: 'Rota de API não encontrada.' });
});

// Tratamento centralizado de erros
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error('Erro na requisição:', err);

  const status = err.status || 500;
  const mensagem =
    status === 500 ? 'Erro interno do servidor.' : err.message;

  res.status(status).json({ erro: mensagem });
});

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------
app.listen(PORT, async () => {
  console.log(`Servidor Express rodando em http://localhost:${PORT}`);

  try {
    const { rows } = await pool.query('SELECT NOW() AS agora');
    console.log('PostgreSQL conectado em', rows[0].agora);
  } catch (err) {
    console.error('Falha ao conectar ao PostgreSQL:', err.message);
    console.error(
      'Verifique DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME no .env.'
    );
  }
});

// Encerramento gracioso do pool
async function encerrarServidor() {
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', encerrarServidor);
process.on('SIGTERM', encerrarServidor);

module.exports = { app, pool, query };

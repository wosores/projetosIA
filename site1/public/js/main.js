'use strict';

/* ==========================================================================
   Fio & Afeto — Lógica da tela inicial
   Busca os produtos na API e monta a vitrine dinamicamente.
   ========================================================================== */

const gradeProdutos = document.querySelector('#product-grid');
const formatoMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const CHAVE_CARRINHO = 'fioafeto_carrinho';
const IMAGEM_FALLBACK =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#f7efe7"/>
      <rect x="340" y="205" width="120" height="130" rx="18" fill="#c96f4a"/>
      <rect x="320" y="190" width="160" height="28" rx="14" fill="#a95534"/>
      <rect x="320" y="322" width="160" height="28" rx="14" fill="#a95534"/>
      <path d="M355 235h90M355 255h90M355 275h90M355 295h90" stroke="#f2c6b2" stroke-width="6" stroke-linecap="round"/>
      <text x="400" y="430" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#7a655c" text-anchor="middle">Fio &amp; Afeto</text>
    </svg>`
  );

/* --------------------------------------------------------------------------
   Utilitários
   -------------------------------------------------------------------------- */
function formatarPreco(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? formatoMoeda.format(numero) : 'Indisponível';
}

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);

  if (classe) {
    elemento.className = classe;
  }

  if (texto !== undefined && texto !== null) {
    elemento.textContent = texto;
  }

  return elemento;
}

function atualizarAnoAtual() {
  const ano = document.querySelector('#current-year');
  if (ano) {
    ano.textContent = new Date().getFullYear();
  }
}

/* --------------------------------------------------------------------------
   Carrinho local (feedback visual imediato)
   -------------------------------------------------------------------------- */
function lerCarrinho() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) || '[]');
    return Array.isArray(dados) ? dados : [];
  } catch (err) {
    return [];
  }
}

function adicionarAoCarrinho(produto, botao) {
  if (botao.dataset.adicionado === 'true') return;

  const carrinho = lerCarrinho();
  const id = Number(produto.id);
  const item = carrinho.find((entrada) => Number(entrada.id) === id);

  if (item) {
    item.quantidade = Number(item.quantidade || 0) + 1;
  } else {
    carrinho.push({
      id,
      nome: produto.nome,
      preco: Number(produto.preco),
      quantidade: 1,
    });
  }

  try {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
  } catch (err) {
    console.warn('Não foi possível salvar o carrinho:', err.message);
  }

  const textoOriginal = botao.textContent;
  const rotuloOriginal = botao.getAttribute('aria-label');

  botao.dataset.adicionado = 'true';
  botao.textContent = '✓';
  botao.setAttribute('aria-label', 'Produto adicionado ao carrinho');

  window.setTimeout(() => {
    botao.textContent = textoOriginal;
    delete botao.dataset.adicionado;
    if (rotuloOriginal) {
      botao.setAttribute('aria-label', rotuloOriginal);
    }
  }, 1400);

  document.dispatchEvent(
    new CustomEvent('carrinho:atualizado', {
      detail: {
        itens: carrinho.reduce(
          (total, entrada) => total + Number(entrada.quantidade || 0),
          0
        ),
        produto,
      },
    })
  );
}

/* --------------------------------------------------------------------------
   Renderização dos produtos
   -------------------------------------------------------------------------- */
function criarCardProduto(produto) {
  const nome = produto.nome || 'Peça artesanal';
  const categoria = produto.categoria || 'Artesanais';
  const preco = Number(produto.preco);
  const estoque = Number(produto.estoque);
  const esgotado = Number.isFinite(estoque) && estoque <= 0;

  const artigo = criarElemento('article', 'product-card');
  artigo.dataset.id = produto.id;

  const imagemWrap = criarElemento('div', 'product-image');
  const imagem = document.createElement('img');
  imagem.src = produto.imagem_url || IMAGEM_FALLBACK;
  imagem.alt = `${nome} — ${categoria}`;
  imagem.loading = 'lazy';
  imagem.width = 500;
  imagem.height = 375;

  imagem.addEventListener(
    'error',
    () => {
      imagem.src = IMAGEM_FALLBACK;
    },
    { once: true }
  );

  imagemWrap.appendChild(imagem);

  if (esgotado) {
    imagemWrap.appendChild(criarElemento('span', 'badge badge-sale', 'Esgotado'));
  } else if (Number.isFinite(estoque) && estoque <= 5) {
    imagemWrap.appendChild(
      criarElemento('span', 'badge badge-new', 'Últimas unidades')
    );
  }

  const corpo = criarElemento('div', 'product-body');
  corpo.appendChild(criarElemento('p', 'product-category', categoria));
  corpo.appendChild(criarElemento('h3', 'product-name', nome));
  corpo.appendChild(
    criarElemento(
      'p',
      'product-description',
      produto.descricao || 'Peça artesanal produzida no ateliê.'
    )
  );

  const rodape = criarElemento('div', 'product-footer');
  const blocoPreco = document.createElement('div');

  blocoPreco.appendChild(
    criarElemento('span', 'product-price', formatarPreco(preco))
  );

  if (Number.isFinite(preco) && preco > 0) {
    blocoPreco.appendChild(
      criarElemento(
        'span',
        'product-installments',
        `ou 12x de ${formatarPreco(preco / 12)}`
      )
    );
  }

  const botao = criarElemento('button', 'btn btn-primary btn-icon', '🛒');
  botao.type = 'button';
  botao.setAttribute(
    'aria-label',
    esgotado
      ? `${nome} está esgotado`
      : `Adicionar ${nome} ao carrinho`
  );

  if (esgotado) {
    botao.disabled = true;
  } else {
    botao.addEventListener('click', () => adicionarAoCarrinho(produto, botao));
  }

  rodape.append(blocoPreco, botao);
  corpo.appendChild(rodape);
  artigo.append(imagemWrap, corpo);

  return artigo;
}

function renderizarEsqueletos() {
  if (!gradeProdutos) return;

  const fragmento = document.createDocumentFragment();

  for (let i = 0; i < 3; i += 1) {
    const artigo = criarElemento('article', 'product-card product-skeleton');
    artigo.setAttribute('aria-hidden', 'true');

    const imagem = criarElemento('div', 'product-image');
    imagem.appendChild(criarElemento('div', 'skeleton skeleton-image'));

    const corpo = criarElemento('div', 'product-body');
    corpo.append(
      criarElemento('div', 'skeleton skeleton-line skeleton-line-sm'),
      criarElemento('div', 'skeleton skeleton-line skeleton-line-lg'),
      criarElemento('div', 'skeleton skeleton-line'),
      criarElemento('div', 'skeleton skeleton-line skeleton-line-md')
    );

    artigo.append(imagem, corpo);
    fragmento.appendChild(artigo);
  }

  gradeProdutos.replaceChildren(fragmento);
}

function mostrarStatus(titulo, mensagem, permitirTentarNovamente = false) {
  if (!gradeProdutos) return;

  const status = criarElemento('div', 'product-status');
  status.setAttribute('role', 'status');
  status.appendChild(criarElemento('h3', null, titulo));
  status.appendChild(criarElemento('p', null, mensagem));

  if (permitirTentarNovamente) {
    const botao = criarElemento(
      'button',
      'btn btn-outline',
      'Tentar novamente'
    );
    botao.type = 'button';
    botao.addEventListener('click', carregarProdutos);
    status.appendChild(botao);
  }

  gradeProdutos.replaceChildren(status);
}

/* --------------------------------------------------------------------------
   Integração com a API
   -------------------------------------------------------------------------- */
async function carregarProdutos() {
  if (!gradeProdutos || gradeProdutos.dataset.carregando === 'true') {
    return;
  }

  gradeProdutos.dataset.carregando = 'true';
  gradeProdutos.setAttribute('aria-busy', 'true');
  renderizarEsqueletos();

  try {
    const resposta = await fetch('/api/products', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });

    let dados = null;
    try {
      dados = await resposta.json();
    } catch (err) {
      dados = null;
    }

    if (!resposta.ok) {
      throw new Error(
        (dados && dados.erro) ||
          `Não foi possível carregar os produtos (HTTP ${resposta.status}).`
      );
    }

    const produtos = Array.isArray(dados) ? dados : dados && dados.produtos;

    if (!Array.isArray(produtos)) {
      throw new Error('A API retornou uma resposta inesperada.');
    }

    if (produtos.length === 0) {
      mostrarStatus(
        'Nenhum produto por aqui ainda',
        'Estamos preparando novidades. Volte em breve para conferir.'
      );
      return;
    }

    const fragmento = document.createDocumentFragment();
    produtos.forEach((produto) => {
      fragmento.appendChild(criarCardProduto(produto));
    });

    gradeProdutos.replaceChildren(fragmento);
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    mostrarStatus(
      'Não foi possível carregar a vitrine',
      err.message || 'Verifique sua conexão e tente novamente.',
      true
    );
  } finally {
    gradeProdutos.removeAttribute('aria-busy');
    gradeProdutos.dataset.carregando = 'false';
  }
}

/* --------------------------------------------------------------------------
   Sessão do usuário no cabeçalho
   -------------------------------------------------------------------------- */
function obterPrimeiroNome(nome) {
  return String(nome || '').trim().split(/\s+/)[0] || 'Cliente';
}

async function sairDaConta(botao) {
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Saindo…';

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
  } catch (err) {
    console.error('Erro ao encerrar sessão:', err);
  }

  window.location.assign('index.html');
}

function montarAcoesAutenticadas(acoes, usuario) {
  acoes.replaceChildren();

  const linkConta = criarElemento(
    'a',
    'header-user',
    `Olá, ${obterPrimeiroNome(usuario.nome)}`
  );
  linkConta.href = 'conta.html';
  linkConta.title = 'Acessar minha conta';

  const botaoSair = criarElemento('button', 'btn btn-outline header-logout', 'Sair');
  botaoSair.type = 'button';
  botaoSair.addEventListener('click', () => sairDaConta(botaoSair));

  acoes.append(linkConta, botaoSair);
}

async function carregarSessao() {
  const acoes = document.querySelector('.header-actions');
  if (!acoes) return;

  try {
    const resposta = await fetch('/api/auth/me', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });

    if (!resposta.ok) return;

    const dados = await resposta.json();
    if (dados && dados.usuario) {
      montarAcoesAutenticadas(acoes, dados.usuario);
    }
  } catch (err) {
    // Sem sessão ou API indisponível: mantém os links de entrar/criar conta.
    console.warn('Não foi possível verificar a sessão:', err.message);
  }
}

/* --------------------------------------------------------------------------
   Inicialização
   -------------------------------------------------------------------------- */
atualizarAnoAtual();
carregarProdutos();
carregarSessao();

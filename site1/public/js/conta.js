'use strict';

/* ==========================================================================
   Fio & Afeto — Página da conta
   Carrega o usuário autenticado e permite encerrar a sessão.
   ========================================================================== */

const carregandoConta = document.querySelector('#account-loading');
const conteudoConta = document.querySelector('#account-content');
const mensagemConta = document.querySelector('#account-message');
const botaoSair = document.querySelector('#logout-button');

function atualizarAnoAtual() {
  const ano = document.querySelector('#current-year');
  if (ano) {
    ano.textContent = new Date().getFullYear();
  }
}

function obterPrimeiroNome(nome) {
  return String(nome || '').trim().split(/\s+/)[0] || 'Cliente';
}

function formatarData(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(data);
}

function preencherConta(usuario) {
  document.querySelector('#account-greeting').textContent =
    `Olá, ${obterPrimeiroNome(usuario.nome)}!`;
  document.querySelector('#account-name').textContent = usuario.nome || '—';
  document.querySelector('#account-email').textContent = usuario.email || '—';
  document.querySelector('#account-since').textContent = formatarData(
    usuario.criado_em
  );
}

function exibirErroConta(texto) {
  if (!mensagemConta) return;

  mensagemConta.textContent = texto;
  mensagemConta.classList.remove('is-success');
  mensagemConta.classList.add('is-error');
  mensagemConta.hidden = false;
}

function redirecionarParaLogin() {
  window.location.replace('login.html?sessao=expirada');
}

async function carregarConta() {
  try {
    const resposta = await fetch('/api/auth/me', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });

    if (resposta.status === 401) {
      redirecionarParaLogin();
      return;
    }

    let dados = null;
    try {
      dados = await resposta.json();
    } catch (err) {
      dados = null;
    }

    if (!resposta.ok) {
      throw new Error(
        (dados && dados.erro) ||
          `Não foi possível carregar sua conta (HTTP ${resposta.status}).`
      );
    }

    if (!dados || !dados.usuario) {
      throw new Error('A API não retornou os dados do usuário.');
    }

    preencherConta(dados.usuario);

    if (carregandoConta) carregandoConta.hidden = true;
    if (conteudoConta) conteudoConta.hidden = false;
  } catch (err) {
    console.error('Erro ao carregar a conta:', err);
    if (carregandoConta) {
      carregandoConta.textContent =
        'Não foi possível carregar sua conta. Atualize a página ou entre novamente.';
    }
    exibirErroConta(err.message);
  }
}

async function sair() {
  if (!botaoSair) return;

  botaoSair.disabled = true;
  botaoSair.textContent = 'Saindo…';

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
  } catch (err) {
    console.error('Erro ao encerrar a sessão:', err);
  }

  window.location.assign('index.html');
}

atualizarAnoAtual();
carregarConta();

if (botaoSair) {
  botaoSair.addEventListener('click', sair);
}

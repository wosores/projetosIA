'use strict';

/* ==========================================================================
   Fio & Afeto — Autenticação
   Envia login e cadastro para a API e trata respostas/erros.
   ========================================================================== */

const formLogin = document.querySelector('#login-form');
const formCadastro = document.querySelector('#register-form');
const mensagemLogin = document.querySelector('#login-message');
const mensagemCadastro = document.querySelector('#register-message');

/* --------------------------------------------------------------------------
   Utilitários de interface
   -------------------------------------------------------------------------- */
function atualizarAnoAtual() {
  const ano = document.querySelector('#current-year');
  if (ano) {
    ano.textContent = new Date().getFullYear();
  }
}

function exibirMensagem(elemento, texto, tipo = 'error') {
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.classList.remove('is-error', 'is-success');
  elemento.classList.add(tipo === 'success' ? 'is-success' : 'is-error');
  elemento.hidden = false;
}

function limparMensagem(elemento) {
  if (!elemento) return;

  elemento.textContent = '';
  elemento.classList.remove('is-error', 'is-success');
  elemento.hidden = true;
}

function definirCarregando(formulario, carregando, textoCarregando) {
  const botao = formulario.querySelector('button[type="submit"]');
  if (!botao) return;

  if (carregando) {
    botao.dataset.textoOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = textoCarregando;
    formulario.dataset.enviando = 'true';
  } else {
    botao.disabled = false;
    botao.textContent = botao.dataset.textoOriginal || 'Enviar';
    delete formulario.dataset.enviando;
  }
}

/* --------------------------------------------------------------------------
   Comunicação com a API
   -------------------------------------------------------------------------- */
async function enviarRequisicao(url, corpo) {
  let resposta;

  try {
    resposta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(corpo),
    });
  } catch (err) {
    throw new Error(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    );
  }

  const texto = await resposta.text();
  let dados = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch (err) {
      dados = null;
    }
  }

  if (!resposta.ok) {
    throw new Error(
      (dados && (dados.erro || dados.mensagem)) ||
        `Não foi possível concluir a solicitação (HTTP ${resposta.status}).`
    );
  }

  return dados || {};
}

function redirecionarParaConta(atraso = 1000) {
  window.setTimeout(() => {
    window.location.assign('conta.html');
  }, atraso);
}

/* --------------------------------------------------------------------------
   Login
   -------------------------------------------------------------------------- */
if (formLogin) {
  formLogin.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (formLogin.dataset.enviando === 'true') return;
    limparMensagem(mensagemLogin);

    const email = formLogin.email.value.trim();
    const senha = formLogin.senha.value;
    const lembrar = Boolean(formLogin.lembrar && formLogin.lembrar.checked);

    definirCarregando(formLogin, true, 'Entrando…');

    try {
      const dados = await enviarRequisicao('/api/auth/login', {
        email,
        senha,
        lembrar,
      });

      exibirMensagem(
        mensagemLogin,
        dados.mensagem || 'Login realizado! Redirecionando para sua conta…',
        'success'
      );

      formLogin.reset();
      redirecionarParaConta();
    } catch (err) {
      exibirMensagem(mensagemLogin, err.message, 'error');
      definirCarregando(formLogin, false);
    }
  });

  formLogin.addEventListener('input', () => limparMensagem(mensagemLogin));
}

/* --------------------------------------------------------------------------
   Cadastro
   -------------------------------------------------------------------------- */
if (formCadastro) {
  const campoSenha = formCadastro.querySelector('#register-password');
  const campoConfirmacao = formCadastro.querySelector('#register-confirm');

  if (campoSenha && campoConfirmacao) {
    // Se qualquer um dos campos mudar, a validação anterior deixa de valer.
    [campoSenha, campoConfirmacao].forEach((campo) => {
      campo.addEventListener('input', () => {
        campoConfirmacao.setCustomValidity('');
      });
    });
  }

  formCadastro.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (formCadastro.dataset.enviando === 'true') return;
    limparMensagem(mensagemCadastro);

    if (campoSenha && campoConfirmacao) {
      if (campoSenha.value !== campoConfirmacao.value) {
        campoConfirmacao.setCustomValidity('As senhas não coincidem.');
        campoConfirmacao.reportValidity();
        return;
      }
      campoConfirmacao.setCustomValidity('');
    }

    const nome = formCadastro.nome.value.trim();
    const email = formCadastro.email.value.trim();
    const senha = formCadastro.senha.value;

    definirCarregando(formCadastro, true, 'Criando conta…');

    try {
      const dados = await enviarRequisicao('/api/auth/register', {
        nome,
        email,
        senha,
      });

      exibirMensagem(
        mensagemCadastro,
        dados.mensagem || 'Conta criada com sucesso! Redirecionando…',
        'success'
      );

      formCadastro.reset();
      redirecionarParaConta(1200);
    } catch (err) {
      exibirMensagem(mensagemCadastro, err.message, 'error');
      definirCarregando(formCadastro, false);
    }
  });

  formCadastro.addEventListener('input', () => limparMensagem(mensagemCadastro));
}

/* --------------------------------------------------------------------------
   Inicialização
   -------------------------------------------------------------------------- */
atualizarAnoAtual();

const parametrosUrl = new URLSearchParams(window.location.search);
if (parametrosUrl.get('sessao') === 'expirada' && mensagemLogin) {
  exibirMensagem(
    mensagemLogin,
    'Sua sessão expirou ou não foi reconhecida. Entre novamente.',
    'error'
  );
}

// api-client.js
// Cliente seguro para comunicação com o backend

const BACKEND_URL = 'https://api.seu-dominio.com'; // Altere para seu domínio

// ============================================================
// FUNÇÃO AUXILIAR PARA CHAMAR A API
// ============================================================

async function chamarAPI(endpoint, opcoes = {}) {
  try {
    const token = localStorage.getItem('auth_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...opcoes.headers
    };

    // Adicionar token de autenticação se disponível
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: opcoes.method || 'GET',
      headers,
      ...opcoes
    };

    // Remover headers antes de enviar
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const resposta = await fetch(`${BACKEND_URL}${endpoint}`, config);

    // ❌ Token expirado - redirecionar para login
    if (resposta.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('usuario');
      alert('Sessão expirada. Faça login novamente.');
      window.location.href = '/admin.html';
      return null;
    }

    // ❌ Sem permissão
    if (resposta.status === 403) {
      alert('❌ Você não tem permissão para esta ação');
      return null;
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || 'Erro na requisição');
    }

    return dados;
  } catch (erro) {
    console.error('❌ Erro na API:', erro);
    throw erro;
  }
}

// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function loginSeguro(email, senha) {
  try {
    const resposta = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || 'Erro ao fazer login');
    }

    // Guardar token no localStorage
    localStorage.setItem('auth_token', dados.token);
    localStorage.setItem('usuario', JSON.stringify(dados.usuario));

    return dados;
  } catch (erro) {
    throw erro;
  }
}

async function registrarUsuario(email, senha, nome) {
  try {
    const resposta = await chamarAPI('/api/auth/registrar', {
      method: 'POST',
      body: { email, senha, nome }
    });

    return resposta;
  } catch (erro) {
    throw erro;
  }
}

// ============================================================
// DADOS (LEITURA)
// ============================================================

async function carregarEquipes() {
  try {
    const resposta = await chamarAPI('/api/dados/equipes');
    return resposta?.dados || [];
  } catch (erro) {
    console.error('Erro ao carregar equipes:', erro);
    return [];
  }
}

async function carregarJogos() {
  try {
    const resposta = await chamarAPI('/api/dados/jogos');
    return resposta?.dados || [];
  } catch (erro) {
    console.error('Erro ao carregar jogos:', erro);
    return [];
  }
}

async function carregarAtletas() {
  try {
    const resposta = await chamarAPI('/api/dados/atletas');
    return resposta?.dados || [];
  } catch (erro) {
    console.error('Erro ao carregar atletas:', erro);
    return [];
  }
}

// ============================================================
// ATLETAS (CRUD - Admin)
// ============================================================

async function criarAtleta(nome, camisa, idade, classe, equipeId) {
  try {
    const resposta = await chamarAPI('/api/admin/atleta', {
      method: 'POST',
      body: {
        nome,
        camisa: parseInt(camisa),
        idade: parseInt(idade),
        classe,
        equipe_id: parseInt(equipeId)
      }
    });

    if (resposta?.sucesso) {
      alert(`✅ ${resposta.mensagem}`);
      return resposta.dados;
    }
  } catch (erro) {
    alert(`❌ Erro ao criar atleta: ${erro.message}`);
    throw erro;
  }
}

async function atualizarAtleta(atletaId, dados) {
  try {
    const resposta = await chamarAPI(`/api/admin/atleta/${atletaId}`, {
      method: 'PUT',
      body: dados
    });

    if (resposta?.sucesso) {
      alert(`✅ ${resposta.mensagem}`);
      return resposta;
    }
  } catch (erro) {
    alert(`❌ Erro ao atualizar atleta: ${erro.message}`);
    throw erro;
  }
}

async function deletarAtleta(atletaId) {
  try {
    const resposta = await chamarAPI(`/api/admin/atleta/${atletaId}`, {
      method: 'DELETE'
    });

    if (resposta?.sucesso) {
      alert(`✅ ${resposta.mensagem}`);
      return resposta;
    }
  } catch (erro) {
    alert(`❌ Erro ao deletar atleta: ${erro.message}`);
    throw erro;
  }
}

// ============================================================
// JOGOS (CRUD - Admin)
// ============================================================

async function criarJogo(data, hora, mandanteId, visitanteId, status = 'Agendado', rodada = null, localJogo = null) {
  try {
    const resposta = await chamarAPI('/api/admin/jogo', {
      method: 'POST',
      body: {
        data,
        hora,
        mandante_id: parseInt(mandanteId),
        visitante_id: parseInt(visitanteId),
        status,
        rodada: rodada ? parseInt(rodada) : null,
        local_jogo: localJogo
      }
    });

    if (resposta?.sucesso) {
      alert(`✅ ${resposta.mensagem}`);
      return resposta.dados;
    }
  } catch (erro) {
    alert(`❌ Erro ao criar jogo: ${erro.message}`);
    throw erro;
  }
}

async function atualizarJogo(jogoId, dados) {
  try {
    const resposta = await chamarAPI(`/api/admin/jogo/${jogoId}`, {
      method: 'PUT',
      body: dados
    });

    if (resposta?.sucesso) {
      alert(`✅ ${resposta.mensagem}`);
      return resposta;
    }
  } catch (erro) {
    alert(`❌ Erro ao atualizar jogo: ${erro.message}`);
    throw erro;
  }
}

async function deletarJogo(jogoId) {
  try {
    const resposta = await chamarAPI(`/api/admin/jogo/${jogoId}`, {
      method: 'DELETE'
    });

    if (resposta?.sucesso) {
      alert(`✅ ${resposta.mensagem}`);
      return resposta;
    }
  } catch (erro) {
    alert(`❌ Erro ao deletar jogo: ${erro.message}`);
    throw erro;
  }
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function obterTokenAtual() {
  return localStorage.getItem('auth_token');
}

function obterUsuarioAtual() {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
}

function limparSessao() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('usuario');
}

function estaAutenticado() {
  return !!localStorage.getItem('auth_token');
}

// ============================================================
// EXEMPLO DE USO NO HTML
// ============================================================

/*
// No seu HTML:
<form onsubmit="handleLogin(event)">
  <input type="email" id="email" required>
  <input type="password" id="password" required>
  <button type="submit">Login</button>
</form>

// No seu JavaScript:
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const senha = document.getElementById('password').value;
  
  try {
    await loginSeguro(email, senha);
    // ✅ Login bem-sucedido
    window.location.href = '/dashboard.html';
  } catch (erro) {
    console.error('Erro no login:', erro);
  }
}

// Criar atleta:
async function handleCriarAtleta(event) {
  event.preventDefault();
  
  const nome = document.getElementById('nome').value;
  const camisa = document.getElementById('camisa').value;
  const idade = document.getElementById('idade').value;
  const classe = document.getElementById('classe').value;
  const equipeId = document.getElementById('equipe').value;
  
  try {
    const atleta = await criarAtleta(nome, camisa, idade, classe, equipeId);
    console.log('✅ Atleta criado:', atleta);
    // Recarregar lista
    await renderizarListaAtletas();
  } catch (erro) {
    console.error('Erro:', erro);
  }
}

// Deletar atleta:
async function handleDeletarAtleta(atletaId) {
  if (!confirm('Tem certeza que deseja deletar este atleta?')) return;
  
  try {
    await deletarAtleta(atletaId);
    console.log('✅ Atleta deletado');
    // Recarregar lista
    await renderizarListaAtletas();
  } catch (erro) {
    console.error('Erro:', erro);
  }
}
*/

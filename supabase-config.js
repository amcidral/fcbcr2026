// ============================================================
// FCBCR 2026 — Configuração Backend Seguro + Helpers de Dados
// ============================================================

const _BACKEND_URL = 'https://fcbcr-backend-production.up.railway.app';

function obterToken() {
  return localStorage.getItem('auth_token');
}

async function fazerRequisicao(endpoint, opcoes = {}) {
  const token = obterToken();
  const headers = opcoes.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${_BACKEND_URL}${endpoint}`, {
    ...opcoes,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
  
  if (!res.ok) {
    const erro = await res.json().catch(() => ({ erro: res.statusText }));
    throw new Error(erro.erro || `Erro ${res.status}`);
  }
  
  return res.json();
}

const _cache = {};

function _limparCache(chave) {
  if (chave) { delete _cache[chave]; }
  else { Object.keys(_cache).forEach(k => delete _cache[k]); }
}

async function carregarEquipes() {
  if (_cache.equipes) return _cache.equipes;
  try {
    const { dados } = await fazerRequisicao('/api/dados/equipes');
    _cache.equipes = dados;
    return dados;
  } catch (e) {
    console.error('Erro ao carregar equipes:', e);
    return [];
  }
}

async function getEquipeId(nome) {
  const equipes = await carregarEquipes();
  const eq = equipes.find(e => e.nome === nome);
  return eq ? eq.id : null;
}

async function getEquipeNome(id) {
  const equipes = await carregarEquipes();
  const eq = equipes.find(e => e.id === id);
  return eq ? eq.nome : '';
}

async function carregarJogos() {
  try {
    const { dados } = await fazerRequisicao('/api/dados/jogos');
    const equipes = await carregarEquipes();
    const mapa = {};
    equipes.forEach(e => { mapa[e.id] = e; });

    return dados.map(j => {
      const mandante = mapa[j.mandante_id] || {};
      const visitante = mapa[j.visitante_id] || {};
      return {
        id: j.id,
        data: j.data,
        hora: j.hora,
        casa: mandante.nome || 'A definir',
        fora: visitante.nome || 'A definir',
        pontosCasa: j.pontos_casa,
        pontosFora: j.pontos_fora,
        status: j.status,
        rodada: j.rodada,
        local: j.local_jogo,
        pontosAtletasCasa: j.pontos_atletas_casa || [],
        pontosAtletasFora: j.pontos_atletas_fora || []
      };
    });
  } catch (e) {
    console.error('Erro ao carregar jogos:', e);
    return [];
  }
}

async function salvarJogo(jogo) {
  const mandanteId = await getEquipeId(jogo.casa);
  const visitanteId = jogo.fora && jogo.fora !== 'A definir' ? await getEquipeId(jogo.fora) : null;

  const { dados } = await fazerRequisicao('/api/admin/jogo', {
    method: 'POST',
    body: JSON.stringify({
      data: jogo.data,
      hora: jogo.hora,
      mandante_id: mandanteId,
      visitante_id: visitanteId,
      pontos_casa: jogo.pontosCasa !== undefined ? jogo.pontosCasa : null,
      pontos_fora: jogo.pontosFora !== undefined ? jogo.pontosFora : null,
      status: jogo.status || 'Agendado',
      rodada: jogo.rodada || null,
      local_jogo: jogo.local || null,
      pontos_atletas_casa: jogo.pontosAtletasCasa || [],
      pontos_atletas_fora: jogo.pontosAtletasFora || []
    })
  });
  _limparCache('jogos');
  return dados;
}

async function atualizarJogo(jogoId, campos) {
  const dbCampos = {};
  if (campos.casa !== undefined) dbCampos.mandante_id = await getEquipeId(campos.casa);
  if (campos.fora !== undefined) dbCampos.visitante_id = await getEquipeId(campos.fora);
  if (campos.pontosCasa !== undefined) dbCampos.pontos_casa = campos.pontosCasa;
  if (campos.pontosFora !== undefined) dbCampos.pontos_fora = campos.pontosFora;
  if (campos.status !== undefined) dbCampos.status = campos.status;
  if (campos.data !== undefined) dbCampos.data = campos.data;
  if (campos.hora !== undefined) dbCampos.hora = campos.hora;
  if (campos.rodada !== undefined) dbCampos.rodada = campos.rodada;
  if (campos.local !== undefined) dbCampos.local_jogo = campos.local;
  if (campos.pontosAtletasCasa !== undefined) dbCampos.pontos_atletas_casa = campos.pontosAtletasCasa;
  if (campos.pontosAtletasFora !== undefined) dbCampos.pontos_atletas_fora = campos.pontosAtletasFora;

  await fazerRequisicao(`/api/admin/jogo/${jogoId}`, {
    method: 'PUT',
    body: JSON.stringify(dbCampos)
  });
  _limparCache('jogos');
}

async function excluirJogo(jogoId) {
  await fazerRequisicao(`/api/admin/jogo/${jogoId}`, {
    method: 'DELETE'
  });
  _limparCache('jogos');
}

async function carregarClassificacao() {
  try {
    const { dados } = await fazerRequisicao('/api/dados/classificacao');
    return dados;
  } catch (e) {
    console.error('Erro ao carregar classificação:', e);
    return [];
  }
}

async function salvarClassificacao(classificacao) {
  for (const c of classificacao) {
    const equipeId = await getEquipeId(c.time);
    if (!equipeId) continue;

    await fazerRequisicao('/api/admin/classificacao', {
      method: 'POST',
      body: JSON.stringify({
        equipe_id: equipeId,
        v: c.v,
        d: c.d,
        pts_pro: c.ptsPro,
        pts_contra: c.ptsContra,
        pts: c.pts ?? (c.v * 2 + c.d * 1)
      })
    });
  }
  _limparCache('classificacao');
}

async function carregarAtletasPorEquipe() {
  try {
    const { dados } = await fazerRequisicao('/api/dados/atletas');
    const equipes = await carregarEquipes();
    const mapa = {};
    equipes.forEach(e => { mapa[e.id] = e.nome; });

    const resultado = {};
    dados.forEach(a => {
      const nomeEquipe = mapa[a.equipe_id] || 'Sem equipe';
      if (!resultado[nomeEquipe]) resultado[nomeEquipe] = [];
      resultado[nomeEquipe].push({
        id: a.id,
        nome: a.nome,
        classe: a.classe || '',
        camisa: a.camisa,
        idade: a.idade
      });
    });

    return resultado;
  } catch (e) {
    console.error('Erro ao carregar atletas:', e);
    return {};
  }
}

async function salvarAtleta(atleta, equipeNome) {
  const equipeId = await getEquipeId(equipeNome);
  if (!equipeId) throw new Error('Equipe nao encontrada: ' + equipeNome);

  const { dados } = await fazerRequisicao('/api/admin/atleta', {
    method: 'POST',
    body: JSON.stringify({
      nome: atleta.nome,
      camisa: atleta.camisa,
      idade: atleta.idade,
      classe: atleta.classe,
      equipe_id: equipeId
    })
  });

  _limparCache('atletas');
  return dados;
}

async function atualizarAtleta(atletaId, atleta, novaEquipeNome) {
  const equipeId = await getEquipeId(novaEquipeNome);
  if (!equipeId) throw new Error('Equipe nao encontrada: ' + novaEquipeNome);

  await fazerRequisicao(`/api/admin/atleta/${atletaId}`, {
    method: 'PUT',
    body: JSON.stringify({
      nome: atleta.nome,
      camisa: atleta.camisa,
      idade: atleta.idade,
      classe: atleta.classe,
      equipe_id: equipeId
    })
  });

  _limparCache('atletas');
}

async function excluirAtleta(atletaId) {
  await fazerRequisicao(`/api/admin/atleta/${atletaId}`, {
    method: 'DELETE'
  });
  _limparCache('atletas');
}

async function carregarArtilharia() {
  try {
    const { dados } = await fazerRequisicao('/api/dados/artilharia');
    return dados;
  } catch (e) {
    console.error('Erro ao carregar artilharia:', e);
    return [];
  }
}

async function carregarProfissionais() {
  if (_cache.profissionais) return _cache.profissionais;
  try {
    const { dados } = await fazerRequisicao('/api/dados/profissionais');
    _cache.profissionais = dados;
    return dados;
  } catch (e) {
    console.error('Erro ao carregar profissionais:', e);
    return [];
  }
}

async function salvarProfissional(prof) {
  const registro = {
    nome: prof.nome,
    funcao: prof.funcao,
    categoria: prof.categoria,
    cidade: prof.cidade
  };
  if (prof.id) registro.id = prof.id;

  const { dados } = await fazerRequisicao('/api/admin/profissional', {
    method: prof.id ? 'PUT' : 'POST',
    body: JSON.stringify(registro)
  });
  _limparCache('profissionais');
  return dados;
}

async function importarProfissionaisBulk(lista) {
  if (!lista || lista.length === 0) return { adicionados: 0 };

  const registros = lista.map(p => ({
    nome: p.nome,
    funcao: p.funcao,
    categoria: p.categoria,
    cidade: p.cidade
  }));

  const { dados } = await fazerRequisicao('/api/admin/profissionais/bulk', {
    method: 'POST',
    body: JSON.stringify({ profissionais: registros })
  });
  _limparCache('profissionais');
  return { adicionados: (dados || []).length };
}

async function excluirProfissional(id) {
  await fazerRequisicao(`/api/admin/profissional/${id}`, {
    method: 'DELETE'
  });
  _limparCache('profissionais');
}

async function carregarEscalas() {
  try {
    const { dados } = await fazerRequisicao('/api/dados/escalas');
    return dados;
  } catch (e) {
    console.error('Erro ao carregar escalas:', e);
    return [];
  }
}

async function salvarEscalaJogo(escala) {
  await fazerRequisicao('/api/admin/escala', {
    method: 'POST',
    body: JSON.stringify({
      jogo_id: escala.jogoId,
      chefe: escala.chefe,
      arbitro1: escala.arbitro1,
      arbitro2: escala.arbitro2,
      apontador: escala.apontador,
      cronometrista: escala.cronometrista,
      operador24: escala.operador24,
      classificadora: escala.classificadora,
      transporte: escala.transporte || []
    })
  });
}

async function adicionarEquipe(equipe) {
  const { dados } = await fazerRequisicao('/api/admin/equipe', {
    method: 'POST',
    body: JSON.stringify({
      nome: equipe.nome,
      nome_completo: equipe.nomeCompleto || '',
      cidade: equipe.cidade,
      estado: equipe.estado || 'SC',
      logo: equipe.logo || ''
    })
  });

  _limparCache();
  return dados;
}

async function atualizarEquipe(nomeOriginal, dados) {
  const equipeId = await getEquipeId(nomeOriginal);
  if (!equipeId) throw new Error('Equipe nao encontrada');

  await fazerRequisicao(`/api/admin/equipe/${equipeId}`, {
    method: 'PUT',
    body: JSON.stringify({
      nome: dados.nome,
      cidade: dados.cidade,
      estado: dados.estado,
      logo: dados.logo,
      nome_completo: dados.nomeCompleto || ''
    })
  });

  _limparCache();
}

async function excluirEquipe(nome) {
  const equipeId = await getEquipeId(nome);
  if (!equipeId) return;
  
  await fazerRequisicao(`/api/admin/equipe/${equipeId}`, {
    method: 'DELETE'
  });
  _limparCache();
}

async function contarAtletas() {
  try {
    const atletas = await carregarAtletasPorEquipe();
    let total = 0;
    Object.values(atletas).forEach(lista => { total += lista.length; });
    return total;
  } catch (e) {
    return 0;
  }
}

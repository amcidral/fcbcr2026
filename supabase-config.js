// ============================================================
// FCBCR 2026 — Configuração Supabase + Helpers de Dados
// ============================================================

// SUBSTITUA pelas suas credenciais do Supabase (Settings > API)
const _SUPABASE_URL = 'https://xunafmfsuqvcgvyettzs.supabase.co';
const _SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1bmFmbWZzdXF2Y2d2eWV0dHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NzM1NzUsImV4cCI6MjEwMDA0OTU3NX0.cC7zqhdlAHfnuWlWtq9BaIxj6tjPjjAixb1aJg6d1Bg';

// Inicializa o cliente Supabase
const _supabase = window.supabase.createClient(_SUPABASE_URL, _SUPABASE_ANON_KEY);

// Cache em memória para dados que mudam pouco
const _cache = {};

// ============================================================
// HELPERS INTERNOS
// ============================================================

function _limparCache(chave) {
  if (chave) { delete _cache[chave]; }
  else { Object.keys(_cache).forEach(k => delete _cache[k]); }
}

// ============================================================
// CARREGAR EQUIPES (cacheada)
// ============================================================

async function carregarEquipes() {
  if (_cache.equipes) return _cache.equipes;
  const { data, error } = await _supabase.from('equipes').select('*').order('id');
  if (error) { console.error('Erro ao carregar equipes:', error); return []; }
  _cache.equipes = data;
  return data;
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

// ============================================================
// CARREGAR JOGOS
// ============================================================

async function carregarJogos() {
  const equipes = await carregarEquipes();
  const mapa = {};
  equipes.forEach(e => { mapa[e.id] = e; });

  const { data, error } = await _supabase.from('jogos').select('*').order('id');
  if (error) { console.error('Erro ao carregar jogos:', error); return []; }

  return data.map(j => {
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
}

// ============================================================
// SALVAR JOGO (insert/update)
// ============================================================

async function salvarJogo(jogo) {
  const mandanteId = await getEquipeId(jogo.casa);
  const visitanteId = jogo.fora && jogo.fora !== 'A definir' ? await getEquipeId(jogo.fora) : null;

  const registro = {
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
  };

  if (jogo.id) { registro.id = jogo.id; }

  const { data, error } = await _supabase.from('jogos').upsert(registro).select().single();
  if (error) { console.error('Erro ao salvar jogo:', error); throw error; }
  _limparCache('jogos');
  return data;
}

// ============================================================
// ATUALIZAR JOGO (patch parcial)
// ============================================================

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

  const { error } = await _supabase.from('jogos').update(dbCampos).eq('id', jogoId);
  if (error) { console.error('Erro ao atualizar jogo:', error); throw error; }
  _limparCache('jogos');
}

// ============================================================
// EXCLUIR JOGO
// ============================================================

async function excluirJogo(jogoId) {
  const { error } = await _supabase.from('jogos').delete().eq('id', jogoId);
  if (error) { console.error('Erro ao excluir jogo:', error); throw error; }
  _limparCache('jogos');
}

// ============================================================
// CARREGAR CLASSIFICAÇÃO
// ============================================================

async function carregarClassificacao() {
  const equipes = await carregarEquipes();
  const mapa = {};
  equipes.forEach(e => { mapa[e.id] = e; });

  const { data, error } = await _supabase.from('classificacao').select('*').order('pts', { ascending: false });
  if (error) { console.error('Erro ao carregar classificação:', error); return []; }

  return data.map(c => {
    const eq = mapa[c.equipe_id] || {};
    return {
      time: eq.nome || '',
      cidade: eq.cidade || '',
      v: c.v,
      d: c.d,
      ptsPro: c.pts_pro,
      ptsContra: c.pts_contra,
      logo: eq.logo || '',
      pts: c.pts
    };
  });
}

// ============================================================
// ATUALIZAR CLASSIFICAÇÃO (array completo)
// ============================================================

async function salvarClassificacao(classificacao) {
  for (const c of classificacao) {
    const equipeId = await getEquipeId(c.time);
    if (!equipeId) continue;

    const { error } = await _supabase.from('classificacao').upsert({
      equipe_id: equipeId,
      v: c.v,
      d: c.d,
      pts_pro: c.ptsPro,
      pts_contra: c.ptsContra,
      pts: c.pts ?? (c.v * 2 + c.d * 1)
    }, { onConflict: 'equipe_id' });

    if (error) { console.error('Erro ao salvar classificação:', error); throw error; }
  }
  _limparCache('classificacao');
}

// ============================================================
// CARREGAR ATLETAS POR EQUIPE
// Retorna formato: { "NOME_EQUIPE": [{ id, nome, classe, camisa, idade }, ...] }
// ============================================================

async function carregarAtletasPorEquipe() {
  const equipes = await carregarEquipes();
  const mapa = {};
  equipes.forEach(e => { mapa[e.id] = e.nome; });

  const { data, error } = await _supabase.from('atletas').select('*').order('id');
  if (error) { console.error('Erro ao carregar atletas:', error); return {}; }

  const resultado = {};
  data.forEach(a => {
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
}

// ============================================================
// SALVAR ATLETA
// ============================================================

async function salvarAtleta(atleta, equipeNome) {
  const equipeId = await getEquipeId(equipeNome);
  if (!equipeId) throw new Error('Equipe nao encontrada: ' + equipeNome);

  const { data, error } = await _supabase.from('atletas').insert({
    nome: atleta.nome,
    camisa: atleta.camisa,
    idade: atleta.idade,
    classe: atleta.classe,
    equipe_id: equipeId
  }).select().single();

  if (error) { console.error('Erro ao salvar atleta:', error); throw error; }
  _limparCache('atletas');
  return data;
}

// ============================================================
// ATUALIZAR ATLETA
// ============================================================

async function atualizarAtleta(atletaId, atleta, novaEquipeNome) {
  const equipeId = await getEquipeId(novaEquipeNome);
  if (!equipeId) throw new Error('Equipe nao encontrada: ' + novaEquipeNome);

  const { error } = await _supabase.from('atletas').update({
    nome: atleta.nome,
    camisa: atleta.camisa,
    idade: atleta.idade,
    classe: atleta.classe,
    equipe_id: equipeId
  }).eq('id', atletaId);

  if (error) { console.error('Erro ao atualizar atleta:', error); throw error; }
  _limparCache('atletas');
}

// ============================================================
// EXCLUIR ATLETA
// ============================================================

async function excluirAtleta(atletaId) {
  const { error } = await _supabase.from('atletas').delete().eq('id', atletaId);
  if (error) { console.error('Erro ao excluir atleta:', error); throw error; }
  _limparCache('atletas');
}

// ============================================================
// CARREGAR ARTILHARIA
// Retorna formato: [{ id, nome, time, classe, pontos, jogos: [...] }, ...]
// ============================================================

async function carregarArtilharia() {
  const { data: artilhariaData, error: err1 } = await _supabase
    .from('artilharia')
    .select('*')
    .order('pontos', { ascending: false });

  if (err1) { console.error('Erro ao carregar artilharia:', err1); return []; }
  if (!artilhariaData || artilhariaData.length === 0) return [];

  const atletaIds = artilhariaData.map(a => a.atleta_id);
  const { data: atletasData } = await _supabase.from('atletas').select('id, nome, classe, equipe_id').in('id', atletaIds);
  const equipes = await carregarEquipes();
  const eqMap = {};
  equipes.forEach(e => { eqMap[e.id] = e.nome; });

  const atletaMap = {};
  (atletasData || []).forEach(a => { atletaMap[a.id] = a; });

  return artilhariaData.map(a => {
    const atleta = atletaMap[a.atleta_id] || {};
    return {
      id: a.atleta_id,
      nome: atleta.nome || '',
      time: eqMap[atleta.equipe_id] || '',
      classe: atleta.classe || '',
      pontos: a.pontos,
      jogos: a.jogos || []
    };
  }).sort((a, b) => b.pontos - a.pontos);
}

// ============================================================
// CARREGAR PROFISSIONAIS
// ============================================================

async function carregarProfissionais() {
  if (_cache.profissionais) return _cache.profissionais;
  const { data, error } = await _supabase.from('profissionais').select('*').order('nome');
  if (error) { console.error('Erro ao carregar profissionais:', error); return []; }
  _cache.profissionais = data;
  return data;
}

// ============================================================
// SALVAR PROFISSIONAL
// ============================================================

async function salvarProfissional(prof) {
  const registro = {
    nome: prof.nome,
    funcao: prof.funcao,
    categoria: prof.categoria,
    cidade: prof.cidade
  };
  if (prof.id) registro.id = prof.id;

  const { data, error } = await _supabase.from('profissionais').upsert(registro).select().single();
  if (error) { console.error('Erro ao salvar profissional:', error); throw error; }
  _limparCache('profissionais');
  return data;
}

// ============================================================
// IMPORTAR PROFISSIONAIS (bulk insert)
// ============================================================

async function importarProfissionaisBulk(lista) {
  if (!lista || lista.length === 0) return { adicionados: 0 };

  const registros = lista.map(p => ({
    nome: p.nome,
    funcao: p.funcao,
    categoria: p.categoria,
    cidade: p.cidade
  }));

  const { data, error } = await _supabase.from('profissionais').insert(registros).select();
  if (error) { console.error('Erro ao importar profissionais:', error); throw error; }
  _limparCache('profissionais');
  return { adicionados: (data || []).length };
}

// ============================================================
// EXCLUIR PROFISSIONAL
// ============================================================

async function excluirProfissional(id) {
  const { error } = await _supabase.from('profissionais').delete().eq('id', id);
  if (error) { console.error('Erro ao excluir profissional:', error); throw error; }
  _limparCache('profissionais');
}

// ============================================================
// CARREGAR ESCALAS DE JOGO
// ============================================================

async function carregarEscalas() {
  const { data, error } = await _supabase.from('escalas_jogos').select('*');
  if (error) { console.error('Erro ao carregar escalas:', error); return []; }
  return data;
}

// ============================================================
// SALVAR ESCALA DE JOGO
// ============================================================

async function salvarEscalaJogo(escala) {
  const { error } = await _supabase.from('escalas_jogos').upsert({
    jogo_id: escala.jogoId,
    chefe: escala.chefe,
    arbitro1: escala.arbitro1,
    arbitro2: escala.arbitro2,
    apontador: escala.apontador,
    cronometrista: escala.cronometrista,
    operador24: escala.operador24,
    classificadora: escala.classificadora,
    transporte: escala.transporte || []
  }, { onConflict: 'jogo_id' });

  if (error) { console.error('Erro ao salvar escala:', error); throw error; }
}

// ============================================================
// ADICIONAR EQUIPE
// ============================================================

async function adicionarEquipe(equipe) {
  const { data, error } = await _supabase.from('equipes').insert({
    nome: equipe.nome,
    nome_completo: equipe.nomeCompleto || '',
    cidade: equipe.cidade,
    estado: equipe.estado || 'SC',
    logo: equipe.logo || ''
  }).select().single();

  if (error) { console.error('Erro ao adicionar equipe:', error); throw error; }

  await _supabase.from('classificacao').insert({
    equipe_id: data.id, v: 0, d: 0, pts_pro: 0, pts_contra: 0, pts: 0
  });

  _limparCache();
  return data;
}

// ============================================================
// ATUALIZAR EQUIPE
// ============================================================

async function atualizarEquipe(nomeOriginal, dados) {
  const equipeId = await getEquipeId(nomeOriginal);
  if (!equipeId) throw new Error('Equipe nao encontrada');

  const { error } = await _supabase.from('equipes').update({
    nome: dados.nome,
    cidade: dados.cidade,
    estado: dados.estado,
    logo: dados.logo,
    nome_completo: dados.nomeCompleto || ''
  }).eq('id', equipeId);

  if (error) { console.error('Erro ao atualizar equipe:', error); throw error; }
  _limparCache();
}

// ============================================================
// EXCLUIR EQUIPE (cascade remove atletas)
// ============================================================

async function excluirEquipe(nome) {
  const equipeId = await getEquipeId(nome);
  if (!equipeId) return;
  await _supabase.from('classificacao').delete().eq('equipe_id', equipeId);
  await _supabase.from('equipes').delete().eq('id', equipeId);
  _limparCache();
}

// ============================================================
// CARREGAR CONTAGEM DE ATLETAS POR EQUIPE
// ============================================================

async function contarAtletas() {
  const { count, error } = await _supabase.from('atletas').select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count || 0;
}

const _SUPABASE_URL = 'https://xunafmfsuqvcgvyettzs.supabase.co';
const _SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1bmFmbWZzdXF2Y2d2eWV0dHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NzM1NzUsImV4cCI6MjEwMDA0OTU3NX0.cC7zqhdlAHfnuWlWtq9BaIxj6tjPjjAixb1aJg6d1Bg';
const _supabase = window.supabase.createClient(_SUPABASE_URL, _SUPABASE_ANON_KEY);



const _cache = {};

function _limparCache(chave) {
  if (chave) { delete _cache[chave]; }
  else { Object.keys(_cache).forEach(k => delete _cache[k]); }
}

// ============================================================
// LEITURAS — Direto no Supabase (rápido)
// ============================================================

async function carregarEquipes() {
  if (_cache.equipes) return _cache.equipes;
  try {
    const { data, error } = await _supabase.from('equipes').select('*').order('nome');
    if (error) throw error;
    _cache.equipes = data;
    return data;
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
    const { data, error } = await _supabase.from('jogos').select('*').order('data', { ascending: false });
    if (error) throw error;
    const equipes = await carregarEquipes();
    const mapa = {};
    equipes.forEach(e => { mapa[e.id] = e; });

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
        pontosAtletasFora: j.pontos_atletas_fora || [],
        sumulaPdfUrl: j.sumula_pdf_url || ''
      };
    });
  } catch (e) {
    console.error('Erro ao carregar jogos:', e);
    return [];
  }
}

async function carregarClassificacao() {
  try {
    const [classResult, equipesResult] = await Promise.all([
      _supabase.from('classificacao').select('*').order('pts', { ascending: false }),
      _supabase.from('equipes').select('id, nome, logo, cidade')
    ]);

    if (classResult.error) throw classResult.error;

    const equipesMap = {};
    (equipesResult.data || []).forEach(e => { equipesMap[e.id] = e; });

    return (classResult.data || []).map(c => {
      const eq = equipesMap[c.equipe_id] || {};
      return {
        id: c.id,
        equipe_id: c.equipe_id,
        time: eq.nome || 'Desconhecido',
        logo: eq.logo || '',
        cidade: eq.cidade || '',
        v: c.v,
        d: c.d,
        ptsPro: c.pts_pro,
        ptsContra: c.pts_contra,
        pts: c.pts
      };
    });
  } catch (e) {
    console.error('Erro ao carregar classificação:', e);
    return [];
  }
}

async function carregarAtletasPorEquipe() {
  try {
    const { data, error } = await _supabase.from('atletas').select('*').order('nome');
    if (error) throw error;
    const equipes = await carregarEquipes();
    const mapa = {};
    equipes.forEach(e => { mapa[e.id] = e.nome; });

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
  } catch (e) {
    console.error('Erro ao carregar atletas:', e);
    return {};
  }
}

async function carregarArtilharia() {
  try {
    const [artResult, atletasResult, equipesResult] = await Promise.all([
      _supabase.from('artilharia').select('*').order('pontos', { ascending: false }),
      _supabase.from('atletas').select('id, nome, classe, equipe_id'),
      _supabase.from('equipes').select('id, nome')
    ]);

    if (artResult.error) throw artResult.error;

    const atletasMap = {};
    (atletasResult.data || []).forEach(a => { atletasMap[a.id] = a; });
    const equipesMap = {};
    (equipesResult.data || []).forEach(e => { equipesMap[e.id] = e; });

    return (artResult.data || []).map(a => {
      const atleta = atletasMap[a.atleta_id] || {};
      const equipe = atletasMap[a.atleta_id] ? equipesMap[atleta.equipe_id] : {};
      return {
        id: a.id,
        atleta_id: a.atleta_id,
        nome: atleta.nome || 'Desconhecido',
        classe: atleta.classe || '',
        time: equipe.nome || 'Sem equipe',
        pontos: a.pontos,
        jogos: a.jogos || []
      };
    });
  } catch (e) {
    console.error('Erro ao carregar artilharia:', e);
    return [];
  }
}

async function carregarProfissionais() {
  if (_cache.profissionais) return _cache.profissionais;
  try {
    const { data, error } = await _supabase.from('profissionais').select('*').order('nome');
    if (error) throw error;
    _cache.profissionais = data;
    return data;
  } catch (e) {
    console.error('Erro ao carregar profissionais:', e);
    return [];
  }
}

async function carregarEscalas() {
  try {
    const { data, error } = await _supabase.from('escalas_jogos').select('*');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Erro ao carregar escalas:', e);
    return [];
  }
}

// ============================================================
// ESCRITAS — Direto no Supabase (RLS controla acesso)
// ============================================================

async function salvarJogo(jogo) {
  const mandanteId = await getEquipeId(jogo.casa);
  const visitanteId = jogo.fora && jogo.fora !== 'A definir' ? await getEquipeId(jogo.fora) : null;

  const { data, error } = await _supabase.from('jogos').insert({
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
  }).select().single();
  if (error) throw error;
  _limparCache('jogos');
  return data;
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
  if (campos.sumulaPdfUrl !== undefined) dbCampos.sumula_pdf_url = campos.sumulaPdfUrl;

  const { error } = await _supabase.from('jogos').update(dbCampos).eq('id', jogoId);
  if (error) throw error;
  _limparCache('jogos');
}

async function excluirJogo(jogoId) {
  const { error } = await _supabase.from('jogos').delete().eq('id', jogoId);
  if (error) throw error;
  _limparCache('jogos');
}

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
    if (error) throw error;
  }
  _limparCache('classificacao');
}

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
  if (error) throw error;

  _limparCache('atletas');
  return data;
}

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
  if (error) throw error;

  _limparCache('atletas');
}

async function excluirAtleta(atletaId) {
  const { error } = await _supabase.from('atletas').delete().eq('id', atletaId);
  if (error) throw error;
  _limparCache('atletas');
}

async function salvarProfissional(prof) {
  const registro = {
    nome: prof.nome,
    funcao: prof.funcao,
    categoria: prof.categoria,
    cidade: prof.cidade
  };

  let error;
  if (prof.id) {
    ({ error } = await _supabase.from('profissionais').update(registro).eq('id', prof.id));
  } else {
    ({ error } = await _supabase.from('profissionais').insert(registro));
  }
  if (error) throw error;

  _limparCache('profissionais');
}

async function importarProfissionaisBulk(lista) {
  if (!lista || lista.length === 0) return { adicionados: 0 };

  const registros = lista.map(p => ({
    nome: p.nome,
    funcao: p.funcao,
    categoria: p.categoria,
    cidade: p.cidade
  }));

  const { data, error } = await _supabase.from('profissionais').insert(registros).select();
  if (error) throw error;

  _limparCache('profissionais');
  return { adicionados: (data || []).length };
}

async function excluirProfissional(id) {
  const { error } = await _supabase.from('profissionais').delete().eq('id', id);
  if (error) throw error;
  _limparCache('profissionais');
}

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
    transporte: escala.transporte || ''
  }, { onConflict: 'jogo_id' });
  if (error) throw error;
}

async function adicionarEquipe(equipe) {
  const { data, error } = await _supabase.from('equipes').insert({
    nome: equipe.nome,
    nome_completo: equipe.nomeCompleto || '',
    cidade: equipe.cidade,
    estado: equipe.estado || 'SC',
    logo: equipe.logo || ''
  }).select().single();
  if (error) throw error;

  _limparCache();
  return data;
}

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
  if (error) throw error;

  _limparCache();
}

async function excluirEquipe(nome) {
  const equipeId = await getEquipeId(nome);
  if (!equipeId) return;

  const { error } = await _supabase.from('equipes').delete().eq('id', equipeId);
  if (error) throw error;

  _limparCache();
}

async function obterUsuarioLogado() {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  // Restaura sessão no Supabase client (necessário para RLS)
  try {
    await _supabase.auth.setSession({ access_token: token, refresh_token: '' });
  } catch (e) {
    // Token inválido/expirado — mantém null
    return null;
  }

  return {
    id: localStorage.getItem('usuario_id'),
    nome: localStorage.getItem('usuario_nome') || 'Usuário',
    role: localStorage.getItem('usuario_role') || 'admin',
    email: localStorage.getItem('usuario_email') || ''
  };
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

window._dbRefs = {
  salvarAtleta,
  atualizarAtleta,
  excluirAtleta,
  salvarEscalaJogo,
  salvarProfissional,
  excluirProfissional,
  excluirEquipe
};

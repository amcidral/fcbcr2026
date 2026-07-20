// ============================================================
// FCBCR 2026 — Autenticação via Supabase Auth
// ============================================================

// Login com email e senha
async function fazerLogin(email, senha) {
  const { data, error } = await _supabase.auth.signInWithPassword({
    email: email,
    password: senha
  });
  if (error) throw error;
  return data;
}

// Logout
async function fazerLogout() {
  await _supabase.auth.signOut();
}

// Obter sessão atual
async function obterSessao() {
  const { data: { session } } = await _supabase.auth.getSession();
  return session;
}

// Obter usuário logado com dados do profile
async function obterUsuarioLogado() {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await _supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    nome: profile ? profile.nome : user.email,
    role: profile ? profile.role : 'gestor'
  };
}

// Verificar se está autenticado
async function estaAutenticado() {
  const session = await obterSessao();
  return !!session;
}

// Proteger rota (redireciona se não logado)
async function protegerRota() {
  const autenticado = await estaAutenticado();
  if (!autenticado) {
    window.location.reload();
    return false;
  }
  return true;
}

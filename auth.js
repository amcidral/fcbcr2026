async function fazerLogin(email, senha) {
  const { data, error } = await _supabase.auth.signInWithPassword({ email, senha });
  if (error) throw new Error(error.message || 'Email ou senha inválidos');

  const user = data.user;

  // Busca o profile (nome + role) na tabela profiles
  const { data: profile, error: profileError } = await _supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .single();

  if (!profileError && profile) {
    localStorage.setItem('usuario_nome', profile.nome || '');
    localStorage.setItem('usuario_role', profile.role || 'gestor');
  } else {
    localStorage.setItem('usuario_nome', user.email || 'Usuário');
    localStorage.setItem('usuario_role', 'gestor');
  }

  localStorage.setItem('usuario_id', user.id);
  localStorage.setItem('usuario_email', user.email || '');
}

async function obterUsuarioLogado() {
  const { data: { session }, error } = await _supabase.auth.getSession();
  if (error || !session) return null;

  const user = session.user;

  // Busca profile para obter nome + role
  const { data: profile } = await _supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .single();

  if (profile) {
    localStorage.setItem('usuario_nome', profile.nome || '');
    localStorage.setItem('usuario_role', profile.role || 'gestor');
  }

  localStorage.setItem('usuario_id', user.id);
  localStorage.setItem('usuario_email', user.email || '');

  return {
    id: user.id,
    nome: profile?.nome || user.email || 'Usuário',
    role: profile?.role || 'gestor',
    email: user.email || ''
  };
}

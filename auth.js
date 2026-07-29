async function fazerLogin(email, senha) {
  try {
    const res = await fetch('https://fcbcr-backend-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    if (!res.ok) {
      const erro = await res.json();
      throw new Error(erro.erro || 'Email ou senha inválidos');
    }

    const { token, usuario } = await res.json();
    localStorage.setItem('auth_token', token);
    localStorage.setItem('usuario_id', usuario.id);
    localStorage.setItem('usuario_nome', usuario.nome || '');
    localStorage.setItem('usuario_role', usuario.role || 'admin');
    localStorage.setItem('usuario_email', usuario.email || '');

    if (typeof _supabase !== 'undefined') {
      await _supabase.auth.setSession({ access_token: token, refresh_token: '' });
    }
  } catch (e) {
    throw e;
  }
}

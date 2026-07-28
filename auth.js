// ============================================================
// FCBCR 2026 — Autenticação via Backend Seguro
// ============================================================

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
  } catch (e) {
    throw e;
  }
}

function fazerLogout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('usuario_id');
  localStorage.removeItem('usuario_nome');
  localStorage.removeItem('usuario_role');
  localStorage.removeItem('usuario_email');
  window.location.href = 'admin.html';
}

function obterUsuarioLogado() {
  const token = localStorage.getItem('auth_token');
  const usuarioId = localStorage.getItem('usuario_id');
  if (!token || !usuarioId) return null;
  return {
    id: usuarioId,
    token,
    nome: localStorage.getItem('usuario_nome') || '',
    role: localStorage.getItem('usuario_role') || 'admin',
    email: localStorage.getItem('usuario_email') || ''
  };
}

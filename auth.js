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
  } catch (e) {
    throw e;
  }
}

function fazerLogout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('usuario_id');
  window.location.href = 'admin.html';
}

function obterUsuarioLogado() {
  const token = localStorage.getItem('auth_token');
  const usuarioId = localStorage.getItem('usuario_id');
  return token && usuarioId ? { id: usuarioId, token } : null;
}

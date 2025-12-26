async function checkSession() {
  try {
    const res = await fetch('/api/admin/me');
    const data = await res.json();
    if (data.success) {
      window.location.href = '/admin/dashboard';
    }
  } catch (err) {
    // Ignorar
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const message = document.getElementById('loginMessage');
  const btn = document.getElementById('loginBtn');
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showMessage('Completa usuario y contraseña', 'error');
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Ingresando...';

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (data.success) {
      showMessage('Acceso concedido, redirigiendo...', 'success');
      setTimeout(() => { window.location.href = '/admin/dashboard'; }, 400);
    } else {
      showMessage(data.message || 'Credenciales inválidas', 'error');
    }
  } catch (error) {
    console.error('Error en login', error);
    showMessage('No se pudo iniciar sesión', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Iniciar sesión';
  }
}

function showMessage(text, type) {
  const message = document.getElementById('loginMessage');
  if (!message) return;
  message.textContent = text;
  message.className = `message ${type}`;
  message.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', handleLogin);
  }
});

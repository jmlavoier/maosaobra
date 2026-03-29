'use strict';

// If already authenticated, go straight to dashboard
if (localStorage.getItem('mao_token')) {
  window.location.replace('/dashboard');
}

const form   = document.getElementById('form');
const btn    = document.getElementById('btn');
const errBox = document.getElementById('error-msg');

function showError(msg) {
  errBox.textContent = msg;
  errBox.style.display = 'block';
}

function hideError() {
  errBox.style.display = 'none';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!name || !email || !password) {
    showError('Preencha todos os campos.');
    return;
  }

  if (password.length < 8) {
    showError('A senha deve ter pelo menos 8 caracteres.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'A criar conta…';

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Erro ao criar conta. Tente novamente.');
      return;
    }

    localStorage.setItem('mao_token', data.token);
    localStorage.setItem('mao_user', JSON.stringify(data.user));
    window.location.replace('/dashboard');
  } catch {
    showError('Não foi possível ligar ao servidor. Tente novamente.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar conta';
  }
});

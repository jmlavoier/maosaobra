'use strict';

/* ── SVG icons ────────────────────────────────────────────────────────── */
const ICON_CHECK = `
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="#60A08B"/>
    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const ICON_CIRCLE = `
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10.5" stroke="#C4B8A8" stroke-width="1.5"/>
  </svg>`;

const ICON_UP = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
       fill="none" stroke="white" stroke-width="2">
    <path d="M18 15l-6-6-6 6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const ICON_DOWN = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
       fill="none" stroke="white" stroke-width="2">
    <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const ICON_ARROW_RIGHT = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const ICON_ARROW_LEFT = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (v) =>
  'R$\u00a0' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(str) { return escHtml(str).replace(/'/g, '&#x27;'); }

const CATEGORY_CLASS = {
  'Pacote A — Mão de Obra Geral':       'pacote-a',
  'Pacote B — Banheiros (Acabamentos)': 'pacote-b',
  'Extras — Serviços Adicionais':       'extras',
};

/* ── Auth ────────────────────────────────────────────────────────────── */
function getToken() { return localStorage.getItem('mao_token'); }
function getUser()  {
  try { return JSON.parse(localStorage.getItem('mao_user')); } catch { return null; }
}

function signOut() {
  localStorage.removeItem('mao_token');
  localStorage.removeItem('mao_user');
  window.location.replace('/signin');
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    signOut();
    return null;
  }
  return res;
}

/* ── Router ──────────────────────────────────────────────────────────── */
function navigate(path) {
  window.history.pushState({}, '', path);
  route();
}

function route() {
  const path = window.location.pathname;
  const projectMatch = path.match(/^\/project\/(\d+)$/);
  if (projectMatch) {
    renderProject(parseInt(projectMatch[1], 10));
  } else if (path === '/dashboard' || path === '/') {
    renderDashboard();
  } else {
    navigate('/dashboard');
  }
}

window.addEventListener('popstate', route);

/* ── Top bar ─────────────────────────────────────────────────────────── */
function initTopBar(user) {
  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
  document.getElementById('avatar').textContent = initial;
  document.getElementById('topbar-name').textContent = user.name;
  document.getElementById('topbar').style.display = 'flex';
  document.getElementById('topbar-brand').addEventListener('click', () => navigate('/dashboard'));
  document.getElementById('btn-signout').addEventListener('click', signOut);
}

/* ── Dashboard view ──────────────────────────────────────────────────── */
async function renderDashboard() {
  document.title = 'Dashboard — Mãos à Obra';
  const app = document.getElementById('app');
  app.innerHTML = '<p class="status-msg">A carregar projetos…</p>';

  const res = await apiFetch('/api/projects');
  if (!res) return;

  if (!res.ok) {
    app.innerHTML = '<p class="status-msg error">Erro ao carregar projetos.</p>';
    return;
  }

  const projects = await res.json();

  if (projects.length === 0) {
    app.innerHTML = `
      <p class="dash-title">Meus Projetos</p>
      <div class="empty-state"><p>Nenhum projeto encontrado.</p></div>`;
    return;
  }

  const cardsHtml = projects.map(p => `
    <div class="project-card" data-id="${p.id}">
      <div class="project-card-info">
        <h2>${escHtml(p.name)}</h2>
        <p>${escHtml(p.address || '')}${p.address && p.worker_name ? ' &nbsp;·&nbsp; ' : ''}${escHtml(p.worker_name || '')}</p>
      </div>
      <span class="project-card-arrow">${ICON_ARROW_RIGHT}</span>
    </div>`).join('');

  app.innerHTML = `
    <p class="dash-title">Meus Projetos</p>
    <div class="project-grid">${cardsHtml}</div>`;

  app.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      navigate(`/project/${card.dataset.id}`);
    });
  });
}

/* ── Project view ────────────────────────────────────────────────────── */
let projectState  = null;  // current project object
let groupsState   = [];    // [{category, total_value, items}]
let collapsed     = {};    // { category: bool }

async function renderProject(id) {
  document.title = 'Projeto — Mãos à Obra';
  const app = document.getElementById('app');
  app.innerHTML = '<p class="status-msg">A carregar…</p>';

  const [projRes, svcRes] = await Promise.all([
    apiFetch(`/api/projects/${id}`),
    apiFetch(`/api/projects/${id}/services`),
  ]);

  if (!projRes || !svcRes) return; // 401 handled — redirect in flight

  if (!projRes.ok || !svcRes.ok) {
    app.innerHTML = '<p class="status-msg error">Projeto não encontrado.</p>';
    return;
  }

  projectState = await projRes.json();
  groupsState  = await svcRes.json();
  groupsState.forEach(g => { collapsed[g.category] = false; });

  document.title = `${projectState.name} — Mãos à Obra`;
  paintProject();
}

function computeTotals() {
  let totalItems = 0, doneItems = 0, totalValue = 0, doneValue = 0;
  for (const g of groupsState) {
    for (const item of g.items) {
      totalItems++;
      totalValue += item.value;
      if (item.done) { doneItems++; doneValue += item.value; }
    }
  }
  return { totalItems, doneItems, totalValue, doneValue };
}

function paintProject() {
  const app = document.getElementById('app');
  const { totalItems, doneItems, totalValue, doneValue } = computeTotals();
  const pct = totalItems ? Math.round(doneItems / totalItems * 100) : 0;

  const headerHtml = `
    <span class="back-link" id="back-btn">${ICON_ARROW_LEFT} Projetos</span>
    <div class="header-card">
      <h1>${escHtml(projectState.name)}</h1>
      <p class="header-subtitle">${escHtml(projectState.address || '')}${projectState.address && projectState.worker_name ? ' &nbsp;|&nbsp; ' : ''}${escHtml(projectState.worker_name || '')}</p>

      <div class="progress-row">
        <div>
          <p class="pct-label">Progresso Geral</p>
          <span class="pct-value">${pct}%</span>
        </div>
        <p class="task-count">${doneItems} de ${totalItems} tarefas</p>
      </div>

      <div class="progress-track">
        <div class="progress-fill ${pct === 100 ? 'complete' : ''}" style="width:${pct}%"></div>
      </div>

      <div class="budget-grid">
        <div class="budget-card total">
          <p class="label">Orçamento Total</p>
          <p class="amount">${fmt(totalValue)}</p>
        </div>
        <div class="budget-card done">
          <p class="label">Valor Concluído</p>
          <p class="amount">${fmt(doneValue)}</p>
        </div>
        <div class="budget-card pending">
          <p class="label">Valor Pendente</p>
          <p class="amount">${fmt(totalValue - doneValue)}</p>
        </div>
      </div>
    </div>`;

  const phasesHtml = groupsState.map(g => {
    const gDone  = g.items.filter(i => i.done).length;
    const gTotal = g.items.length;
    const gPct   = gTotal ? Math.round(gDone / gTotal * 100) : 0;
    const cls    = CATEGORY_CLASS[g.category] || 'extras';
    const open   = !collapsed[g.category];

    const itemsHtml = open ? `
      <ul class="item-list">
        ${g.items.map(item => `
          <li class="item ${item.done ? 'done-item' : ''}"
              data-id="${item.id}" data-done="${item.done}">
            <span class="item-icon">${item.done ? ICON_CHECK : ICON_CIRCLE}</span>
            <span class="item-text">${escHtml(item.description)}</span>
          </li>`).join('')}
      </ul>` : '';

    return `
      <div class="phase-card">
        <button class="phase-header ${cls}" data-cat="${escAttr(g.category)}">
          <div>
            <div class="phase-title">${escHtml(g.category)}</div>
            <div class="phase-meta">${fmt(g.total_value)} &nbsp;·&nbsp; ${gDone}/${gTotal} concluído</div>
          </div>
          <div class="phase-right">
            <div class="mini-track">
              <div class="mini-fill" style="width:${gPct}%"></div>
            </div>
            <span class="phase-pct">${gPct}%</span>
            <span class="chevron">${open ? ICON_UP : ICON_DOWN}</span>
          </div>
        </button>
        ${itemsHtml}
      </div>`;
  }).join('');

  app.innerHTML = `
    ${headerHtml}
    <div class="phases">${phasesHtml}</div>
    <p class="footer">Controle de Obra — maosaobra</p>`;

  // Back button
  document.getElementById('back-btn').addEventListener('click', () => navigate('/dashboard'));

  // Phase toggles
  app.querySelectorAll('.phase-header').forEach(btn => {
    btn.addEventListener('click', () => {
      collapsed[btn.dataset.cat] = !collapsed[btn.dataset.cat];
      paintProject();
    });
  });

  // Item toggles
  app.querySelectorAll('.item').forEach(li => {
    li.addEventListener('click', () => {
      const id   = parseInt(li.dataset.id, 10);
      const done = li.dataset.done === 'true';
      toggleService(id, done).catch(err => {
        console.error(err);
        alert('Erro ao actualizar o serviço. Tente novamente.');
      });
    });
  });
}

async function toggleService(id, currentDone) {
  const res = await apiFetch(`/api/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ done: !currentDone }),
  });
  if (!res) return;
  if (!res.ok) throw new Error('Falha ao actualizar serviço');
  const updated = await res.json();

  for (const g of groupsState) {
    const item = g.items.find(i => i.id === updated.id);
    if (item) { item.done = updated.done; break; }
  }

  paintProject();
}

/* ── Boot ────────────────────────────────────────────────────────────── */
(function boot() {
  const token = getToken();
  const user  = getUser();

  if (!token || !user) {
    window.location.replace('/signin');
    return;
  }

  initTopBar(user);

  // Redirect bare root to /dashboard
  if (window.location.pathname === '/') {
    window.history.replaceState({}, '', '/dashboard');
  }

  route();
})();

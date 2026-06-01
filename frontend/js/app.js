/**
 * app.js – Main entry point
 * Wires router, sidebar, and all views together.
 */
import { Router }        from './router.js';
import { isAuthenticated, getUser, getUserRole, logout as doLogout } from './auth.js';
import { renderLogin }    from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderUsers }    from './views/users.js';
import { renderNotes }    from './views/notes.js';
import { renderBulletin } from './views/bulletin.js';

/* ─── DOM refs ──────────────────────────────────────── */
const app        = document.getElementById('app');
const sidebar    = document.getElementById('sidebar');
const sidebarNav = document.getElementById('sidebar-nav');
const sidebarUser = document.getElementById('sidebar-user');
const menuToggle = document.getElementById('menu-toggle');

/* ─── Router ────────────────────────────────────────── */
const router = new Router();

/* ─── Navigation config per role ────────────────────── */
const NAV = {
  admin: [
    { path: '/dashboard', icon: '📊', label: 'Tableau de bord' },
    { path: '/users',     icon: '👥', label: 'Utilisateurs' },
    { path: '/notes',     icon: '📝', label: 'Notes' },
    { path: '/bulletin',  icon: '📄', label: 'Bulletins' },
  ],
  formateur: [
    { path: '/dashboard', icon: '📊', label: 'Tableau de bord' },
    { path: '/notes',     icon: '📝', label: 'Saisie des notes' },
    { path: '/bulletin',  icon: '📄', label: 'Bulletins' },
  ],
  stagiaire: [
    { path: '/dashboard', icon: '📊', label: 'Tableau de bord' },
    { path: '/notes',     icon: '📝', label: 'Mes notes' },
    { path: '/bulletin',  icon: '📄', label: 'Mon bulletin' },
  ],
};

/* ═══════════════════════════════════════════════════════
   Sidebar rendering
   ═══════════════════════════════════════════════════════ */
function renderSidebar() {
  const user = getUser();
  const role = getUserRole();
  if (!user || !role) return;

  const items   = NAV[role] || [];
  const current = window.location.hash.slice(1) || '/dashboard';

  sidebarNav.innerHTML = items.map(i => `
    <a href="#${i.path}"
       class="sidebar-nav-item ${current === i.path ? 'active' : ''}"
       data-path="${i.path}">
      <span class="nav-icon">${i.icon}</span>
      <span class="nav-label">${i.label}</span>
    </a>`).join('');

  sidebarUser.innerHTML = `
    <div class="user-info">
      <div class="user-avatar">${(user.name || '?').charAt(0).toUpperCase()}</div>
      <div>
        <div class="user-name">${user.name}</div>
        <div class="user-role">${role}</div>
      </div>
    </div>
    <button id="logout-btn" class="sidebar-logout">🚪 Déconnexion</button>`;

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    doLogout();
    hide();
    router.navigate('/login');
  });
}

function show() {
  sidebar.classList.remove('hidden');
  app.classList.add('with-sidebar');
  menuToggle.classList.remove('hidden');
  renderSidebar();
}

function hide() {
  sidebar.classList.add('hidden');
  sidebar.classList.remove('open');
  app.classList.remove('with-sidebar');
  menuToggle.classList.add('hidden');
}

/* ═══════════════════════════════════════════════════════
   Route guard
   ═══════════════════════════════════════════════════════ */
function guard(viewFn, allowedRoles = []) {
  return (...args) => {
    if (!isAuthenticated()) { hide(); router.navigate('/login'); return; }
    const role = getUserRole();
    if (allowedRoles.length && !allowedRoles.includes(role)) {
      router.navigate('/dashboard');
      return;
    }
    show();
    sidebar.classList.remove('open'); // close mobile drawer
    viewFn(app, ...args);
  };
}

/* ═══════════════════════════════════════════════════════
   Routes
   ═══════════════════════════════════════════════════════ */
router
  .on('/login', () => {
    if (isAuthenticated()) { router.navigate('/dashboard'); return; }
    hide();
    renderLogin(app, router);
  })
  .on('/dashboard', guard(renderDashboard))
  .on('/users',     guard(renderUsers,   ['admin']))
  .on('/notes',     guard(renderNotes))
  .on('/bulletin',  guard(renderBulletin));

/* ─── Mobile menu toggle ────────────────────────────── */
menuToggle?.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

/* ─── Boot ──────────────────────────────────────────── */
router.start();

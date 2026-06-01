/**
 * views/dashboard.js – Role-aware dashboard
 */
import { users, notes } from '../api.js';
import { getUser, getUserRole } from '../auth.js';

export async function renderDashboard(container) {
  const user = getUser();
  const role = getUserRole();

  container.innerHTML = `
    <div class="page-header animate-fade-up">
      <div>
        <h1>Bonjour, ${user.name} 👋</h1>
        <p class="text-secondary">Bienvenue sur votre tableau de bord</p>
      </div>
    </div>
    <div id="dashboard-content">
      <div class="loading-container"><div class="spinner"></div></div>
    </div>
  `;

  const content = document.getElementById('dashboard-content');
  try {
    if (role === 'admin')          await adminDashboard(content);
    else if (role === 'formateur') await formateurDashboard(content);
    else                           await stagiaireDashboard(content, user);
  } catch (err) {
    content.innerHTML = `<div class="empty-state glass-card"><p>Erreur de chargement : ${err.message}</p></div>`;
  }
}

/* ═══════ Admin Dashboard ═══════════════════════════════ */
async function adminDashboard(el) {
  const result   = await users.getAll();
  const all      = result.data || [];
  const admins   = all.filter(u => u.role === 'admin');
  const forms    = all.filter(u => u.role === 'formateur');
  const stags    = all.filter(u => u.role === 'stagiaire');

  el.innerHTML = `
    <div class="stats-grid">
      ${statCard('👥', all.length,    'Total Utilisateurs', '--primary-glow', '--primary-light', 0)}
      ${statCard('🛡️', admins.length, 'Administrateurs',   '--danger-bg',   '--danger',        1)}
      ${statCard('👨‍🏫', forms.length,  'Formateurs',        '--warning-bg',  '--warning',       2)}
      ${statCard('🎓', stags.length,  'Stagiaires',        '--success-bg',  '--success',       3)}
    </div>

    <div class="card glass-card mt-3 animate-fade-up" style="--delay:5">
      <div class="card-header">
        <h3>👥 Utilisateurs récents</h3>
        <a href="#/users" class="btn btn-sm btn-outline">Voir tout →</a>
      </div>
      <div class="card-body">
        ${all.length ? `
          <table class="data-table">
            <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Filière</th></tr></thead>
            <tbody>
              ${all.slice(0, 5).map(u => `
                <tr>
                  <td><strong>${u.name}</strong></td>
                  <td class="text-secondary">${u.email}</td>
                  <td><span class="badge badge-${u.role}">${u.role}</span></td>
                  <td>${u.filiere || '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>` : '<p class="text-muted">Aucun utilisateur.</p>'}
      </div>
    </div>`;
}

/* ═══════ Formateur Dashboard ═══════════════════════════ */
async function formateurDashboard(el) {
  let stags = [];
  try { stags = (await users.getAll('?role=stagiaire')).data || []; } catch {}

  el.innerHTML = `
    <div class="stats-grid">
      ${statCard('🎓', stags.length, 'Stagiaires', '--success-bg', '--success', 0)}
      ${statCard('📝', '+', 'Saisir une note', '--primary-glow', '--primary-light', 1)}
    </div>

    <div class="card glass-card mt-3 animate-fade-up" style="--delay:3">
      <div class="card-header">
        <h3>🎓 Stagiaires</h3>
      </div>
      <div class="card-body">
        ${stags.length ? `
          <table class="data-table">
            <thead><tr><th>Nom</th><th>Email</th><th>Filière</th><th>Action</th></tr></thead>
            <tbody>
              ${stags.map(s => `
                <tr>
                  <td><strong>${s.name}</strong></td>
                  <td class="text-secondary">${s.email}</td>
                  <td>${s.filiere || '—'}</td>
                  <td><a href="#/notes" class="btn btn-sm btn-primary">Ajouter note</a></td>
                </tr>`).join('')}
            </tbody>
          </table>` : '<div class="empty-state"><p>Aucun stagiaire trouvé.</p></div>'}
      </div>
    </div>`;
}

/* ═══════ Stagiaire Dashboard ═══════════════════════════ */
async function stagiaireDashboard(el, user) {
  let data = null;
  try { data = (await notes.getBulletin(user.id)).data; } catch {}

  const avg     = data?.overallAverage;
  const mention = data?.mention || '—';
  const total   = data?.totalNotes || 0;
  const modules = data?.modules || [];

  const pct    = avg != null ? (avg / 20) * 100 : 0;
  const C      = 2 * Math.PI * 54;
  const offset = C - (pct / 100) * C;

  el.innerHTML = `
    <div class="stats-grid stats-grid-3">
      <div class="stat-card stat-card-large animate-fade-up" style="--delay:0">
        <div class="circular-progress">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="8"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="url(#grd)" stroke-width="8"
              stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${offset}"
              transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1.5s ease-in-out"/>
            <defs><linearGradient id="grd" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#6c5ce7"/>
              <stop offset="100%" stop-color="#a29bfe"/>
            </linearGradient></defs>
          </svg>
          <div class="circular-value">${avg != null ? avg.toFixed(2) : '—'}</div>
          <div class="circular-label">/ 20</div>
        </div>
        <div class="stat-label">Moyenne Générale</div>
      </div>

      <div class="stat-card animate-fade-up" style="--delay:1">
        <div class="stat-icon" style="background:var(--warning-bg);color:var(--warning)">🏅</div>
        <div class="stat-value stat-value-sm">${mention}</div>
        <div class="stat-label">Mention</div>
      </div>

      <div class="stat-card animate-fade-up" style="--delay:2">
        <div class="stat-icon" style="background:var(--info-bg);color:var(--info)">📝</div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">Notes reçues</div>
      </div>
    </div>

    ${modules.length ? `
      <div class="card glass-card mt-3 animate-fade-up" style="--delay:4">
        <div class="card-header">
          <h3>📚 Aperçu par module</h3>
          <a href="#/bulletin" class="btn btn-sm btn-outline">Voir le bulletin →</a>
        </div>
        <div class="card-body">
          <div class="modules-grid">
            ${modules.map(m => `
              <div class="module-card">
                <div class="module-name">${m.module}</div>
                <div class="module-avg ${m.average >= 10 ? 'text-success' : 'text-danger'}">${m.average.toFixed(2)}/20</div>
                <div class="module-bar">
                  <div class="module-bar-fill" style="width:${(m.average/20)*100}%;background:${m.average>=10?'var(--success)':'var(--danger)'}"></div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>` : ''}`;
}

/* ─── helper ─────────────────────────────────────────── */
function statCard(icon, value, label, bgVar, colorVar, delay) {
  return `
    <div class="stat-card animate-fade-up" style="--delay:${delay}">
      <div class="stat-icon" style="background:var(${bgVar});color:var(${colorVar})">${icon}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
}

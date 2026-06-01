/**
 * views/bulletin.js – Full academic transcript
 *   Stagiaire : own bulletin automatically
 *   Admin/Formateur : select a stagiaire first
 */
import { notes, users } from '../api.js';
import { getUser, getUserRole } from '../auth.js';

export async function renderBulletin(container) {
  const role = getUserRole();
  const user = getUser();

  /* Stagiaire → show own bulletin directly */
  if (role === 'stagiaire') {
    container.innerHTML = `
      <div class="page-header animate-fade-up"><div>
        <h1>📄 Mon Bulletin Scolaire</h1>
        <p class="text-secondary">Relevé complet de vos notes et moyennes</p>
      </div></div>
      <div id="bulletin-content"><div class="loading-container"><div class="spinner"></div></div></div>`;
    return loadBulletin(user.id, user);
  }

  /* Admin / Formateur → choose stagiaire */
  let stags = [];
  try { stags = (await users.getAll('?role=stagiaire')).data || []; } catch {}

  container.innerHTML = `
    <div class="page-header animate-fade-up"><div>
      <h1>📄 Bulletin Scolaire</h1>
      <p class="text-secondary">Consultez le bulletin d'un stagiaire</p>
    </div>
    <select class="form-select" id="bull-stag" style="max-width:300px">
      <option value="">— Sélectionner un stagiaire —</option>
      ${stags.map(s => `<option value="${s._id}" data-name="${s.name}" data-filiere="${s.filiere||''}">${s.name}${s.filiere ? ' ('+s.filiere+')' : ''}</option>`).join('')}
    </select>
    </div>
    <div id="bulletin-content"><div class="empty-state glass-card"><p>Sélectionnez un stagiaire pour afficher son bulletin.</p></div></div>`;

  document.getElementById('bull-stag').addEventListener('change', (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    if (e.target.value) {
      loadBulletin(e.target.value, { name: opt.dataset.name, filiere: opt.dataset.filiere });
    }
  });
}

/* ═══════════════════════════════════════════════════════ */
async function loadBulletin(stagId, userInfo) {
  const el = document.getElementById('bulletin-content');
  el.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

  try {
    const data = (await notes.getBulletin(stagId)).data;

    if (!data || !data.modules || !data.modules.length) {
      el.innerHTML = '<div class="empty-state glass-card"><p>📚 Aucune note disponible pour ce stagiaire.</p></div>';
      return;
    }

    const avg = data.overallAverage;
    const mentionClass =
      avg >= 16 ? 'mention-tb' :
      avg >= 14 ? 'mention-b'  :
      avg >= 12 ? 'mention-ab' :
      avg >= 10 ? 'mention-p'  : 'mention-i';

    const studentName = data.stagiaireName || userInfo?.name || '—';
    const filiere     = userInfo?.filiere || '';

    el.innerHTML = `
      <div class="bulletin glass-card animate-fade-up">
        <!-- Header -->
        <div class="bulletin-header">
          <div class="bulletin-logo">🎓</div>
          <h2>EduNotes — Relevé de Notes</h2>
          <div class="bulletin-student">
            <span class="bulletin-name">${studentName}</span>
            ${filiere ? `<span class="bulletin-filiere">${filiere}</span>` : ''}
          </div>
        </div>

        <!-- Grades table -->
        <table class="bulletin-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Notes obtenues</th>
              <th style="text-align:right">Moyenne</th>
            </tr>
          </thead>
          <tbody>
            ${data.modules.map(m => `
              <tr>
                <td class="module-name-cell"><strong>${m.module}</strong></td>
                <td>
                  ${m.notes.map(n => `<span class="note-chip ${n.note >= 10 ? 'note-pass' : 'note-fail'}">${n.note}</span>`).join(' ')}
                </td>
                <td style="text-align:right">
                  <strong class="${m.average >= 10 ? 'text-success' : 'text-danger'}">${m.average.toFixed(2)}/20</strong>
                </td>
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr class="bulletin-total">
              <td colspan="2"><strong>Moyenne Générale</strong></td>
              <td style="text-align:right"><strong class="overall-avg">${avg.toFixed(2)}/20</strong></td>
            </tr>
          </tfoot>
        </table>

        <!-- Footer -->
        <div class="bulletin-footer">
          <div class="mention-display ${mentionClass}">
            <span class="mention-label">Mention</span>
            <span class="mention-value">${data.mention}</span>
          </div>
          <div class="bulletin-date">
            Généré le ${new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
          </div>
        </div>
      </div>`;

  } catch (err) {
    el.innerHTML = `<div class="empty-state glass-card"><p>Erreur : ${err.message}</p></div>`;
  }
}

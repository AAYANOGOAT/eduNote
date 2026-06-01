/**
 * views/notes.js – Notes management (role-aware)
 *   Formateur : add note + view per stagiaire
 *   Admin     : view per stagiaire + delete
 *   Stagiaire : view own notes
 */
import { notes, users } from '../api.js';
import { getUser, getUserRole } from '../auth.js';
import { showToast, openModal, closeModal } from '../ui.js';

export async function renderNotes(container) {
  const role = getUserRole();
  const user = getUser();

  if (role === 'stagiaire') return renderOwn(container, user);
  return renderManage(container, role);
}

/* ═══════════════════════════════════════════════════════
   Stagiaire – Own notes
   ═══════════════════════════════════════════════════════ */
async function renderOwn(container, user) {
  container.innerHTML = `
    <div class="page-header animate-fade-up"><div>
      <h1>📝 Mes notes</h1>
      <p class="text-secondary">Consultez vos notes par module</p>
    </div></div>
    <div id="notes-content"><div class="loading-container"><div class="spinner"></div></div></div>`;

  const el = document.getElementById('notes-content');
  try {
    const list = (await notes.getByStagiaire(user.id)).data || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state glass-card"><p>📚 Aucune note pour le moment.</p></div>'; return; }

    const grouped = {};
    list.forEach(n => { (grouped[n.module] ??= []).push(n); });

    el.innerHTML = Object.entries(grouped).map(([mod, arr]) => {
      const avg = arr.reduce((s, n) => s + n.note, 0) / arr.length;
      return `
        <div class="card glass-card mb-1 animate-fade-up" style="margin-bottom:1rem">
          <div class="card-header">
            <h3>📚 ${mod}</h3>
            <span class="badge ${avg >= 10 ? 'badge-success' : 'badge-danger'}">Moyenne : ${avg.toFixed(2)}/20</span>
          </div>
          <div class="card-body">
            <table class="data-table">
              <thead><tr><th>Note</th><th>Commentaire</th><th>Formateur</th><th>Date</th></tr></thead>
              <tbody>${arr.map(n => `
                <tr>
                  <td><strong class="${n.note >= 10 ? 'text-success' : 'text-danger'}">${n.note}/20</strong></td>
                  <td>${n.commentaire || '—'}</td>
                  <td>${n.formateurName || '—'}</td>
                  <td class="text-secondary">${fmtDate(n.createdAt)}</td>
                </tr>`).join('')}</tbody>
            </table>
          </div>
        </div>`;
    }).join('');
  } catch (err) { el.innerHTML = `<div class="empty-state"><p>Erreur : ${err.message}</p></div>`; }
}

/* ═══════════════════════════════════════════════════════
   Formateur / Admin – Manage notes
   ═══════════════════════════════════════════════════════ */
async function renderManage(container, role) {
  let stags = [];
  try { stags = (await users.getAll('?role=stagiaire')).data || []; } catch {}

  container.innerHTML = `
    <div class="page-header animate-fade-up"><div>
      <h1>📝 ${role === 'admin' ? 'Gestion des notes' : 'Saisie des notes'}</h1>
      <p class="text-secondary">${role === 'admin' ? 'Consulter et supprimer les notes' : 'Ajouter et gérer les notes des stagiaires'}</p>
    </div></div>

    ${role === 'formateur' ? addNoteForm(stags) : ''}

    <div class="card glass-card animate-fade-up" style="--delay:4">
      <div class="card-header">
        <h3>📋 Notes par stagiaire</h3>
        <select class="form-select form-select-sm" id="view-stag">
          <option value="">— Sélectionner un stagiaire —</option>
          ${stags.map(s => `<option value="${s._id}">${s.name}${s.filiere ? ' ('+s.filiere+')' : ''}</option>`).join('')}
        </select>
      </div>
      <div class="card-body" id="stag-notes">
        <div class="empty-state"><p>Sélectionnez un stagiaire pour voir ses notes.</p></div>
      </div>
    </div>`;

  /* ── Add-note form handler ─────────────────────────── */
  const addForm = document.getElementById('add-note-form');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd  = new FormData(e.target);
      const sel = document.getElementById('note-stag');
      const opt = sel.options[sel.selectedIndex];
      try {
        await notes.add({
          stagiaireId:   fd.get('stagiaireId'),
          stagiaireName: opt?.dataset.name || '',
          module:        fd.get('module'),
          note:          parseFloat(fd.get('note')),
          commentaire:   fd.get('commentaire'),
        });
        showToast('Note ajoutée avec succès ! 🎉', 'success');
        e.target.reset();
        /* Refresh list if same stagiaire visible */
        const sel2 = document.getElementById('view-stag');
        if (sel2.value) loadNotes(sel2.value, role);
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  /* ── View notes per stagiaire ──────────────────────── */
  document.getElementById('view-stag').addEventListener('change', (e) => {
    if (e.target.value) loadNotes(e.target.value, role);
  });
}

/* ─── Load notes for a specific stagiaire ────────────── */
async function loadNotes(stagId, role) {
  const el = document.getElementById('stag-notes');
  el.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

  try {
    const list = (await notes.getByStagiaire(stagId)).data || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state"><p>Aucune note pour ce stagiaire.</p></div>'; return; }

    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Module</th><th>Note</th><th>Commentaire</th><th>Formateur</th><th>Date</th>${role !== 'stagiaire' ? '<th>Actions</th>' : ''}</tr></thead>
        <tbody>${list.map(n => `
          <tr>
            <td><strong>${n.module}</strong></td>
            <td><span class="${n.note >= 10 ? 'text-success' : 'text-danger'}">${n.note}/20</span></td>
            <td>${n.commentaire || '—'}</td>
            <td>${n.formateurName || '—'}</td>
            <td class="text-secondary">${fmtDate(n.createdAt)}</td>
            ${role === 'admin' ? `<td><button class="btn btn-sm btn-danger" data-action="del" data-id="${n._id}">Supprimer</button></td>` :
              role === 'formateur' ? `<td><button class="btn btn-sm btn-outline" data-action="edit" data-id="${n._id}" data-note="${n.note}" data-comment="${(n.commentaire||'').replace(/"/g,'&quot;')}">Modifier</button></td>` : ''}
          </tr>`).join('')}</tbody>
      </table>`;

    /* Event delegation for action buttons */
    el.onclick = async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;

      if (btn.dataset.action === 'del') {
        openModal(`
          <h2>Supprimer la note</h2>
          <p style="margin:.75rem 0">Êtes-vous sûr de vouloir supprimer cette note ?</p>
          <div class="modal-actions">
            <button class="btn btn-outline" id="modal-cancel">Annuler</button>
            <button class="btn btn-danger" id="confirm-del">Supprimer</button>
          </div>`);
        document.getElementById('modal-cancel').onclick = closeModal;
        document.getElementById('confirm-del').onclick  = async () => {
          try { await notes.delete(id); showToast('Note supprimée.','success'); closeModal(); loadNotes(stagId, role); }
          catch(err){ showToast(err.message,'error'); }
        };
      }

      if (btn.dataset.action === 'edit') {
        openModal(`
          <h2>Modifier la note</h2>
          <form id="edit-note-form" class="modal-form">
            <div class="form-group">
              <label class="form-label">Note (/20)</label>
              <input class="form-input" type="number" name="note" min="0" max="20" step="0.25" value="${btn.dataset.note}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Commentaire</label>
              <textarea class="form-input form-textarea" name="commentaire">${btn.dataset.comment}</textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="modal-cancel">Annuler</button>
              <button type="submit" class="btn btn-primary">Enregistrer</button>
            </div>
          </form>`);
        document.getElementById('modal-cancel').onclick = closeModal;
        document.getElementById('edit-note-form').addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const fd = new FormData(ev.target);
          try {
            await notes.update(id, { note: parseFloat(fd.get('note')), commentaire: fd.get('commentaire') });
            showToast('Note modifiée.','success'); closeModal(); loadNotes(stagId, role);
          } catch(err){ showToast(err.message,'error'); }
        });
      }
    };
  } catch (err) { el.innerHTML = `<div class="empty-state"><p>Erreur : ${err.message}</p></div>`; }
}

/* ─── Add-note form HTML ─────────────────────────────── */
function addNoteForm(stags) {
  return `
    <div class="card glass-card animate-fade-up" style="--delay:2;margin-bottom:1.5rem">
      <div class="card-header"><h3>➕ Ajouter une note</h3></div>
      <div class="card-body">
        <form id="add-note-form" class="form-grid">
          <div class="form-group">
            <label class="form-label">Stagiaire</label>
            <select class="form-select" name="stagiaireId" required id="note-stag">
              <option value="">— Sélectionner —</option>
              ${stags.map(s => `<option value="${s._id}" data-name="${s.name}">${s.name}${s.filiere ? ' ('+s.filiere+')' : ''}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Module</label>
            <input class="form-input" name="module" required placeholder="ex : Développement Web">
          </div>
          <div class="form-group">
            <label class="form-label">Note (/20)</label>
            <input class="form-input" type="number" name="note" min="0" max="20" step="0.25" required placeholder="0 – 20">
          </div>
          <div class="form-group">
            <label class="form-label">Commentaire</label>
            <textarea class="form-input form-textarea" name="commentaire" placeholder="Optionnel…"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Enregistrer la note</button>
          </div>
        </form>
      </div>
    </div>`;
}

/* ─── Helpers ────────────────────────────────────────── */
function fmtDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

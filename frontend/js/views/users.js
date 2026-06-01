/**
 * views/users.js – Admin user management (CRUD)
 */
import { users, auth } from '../api.js';
import { showToast, openModal, closeModal } from '../ui.js';

export async function renderUsers(container) {
  container.innerHTML = `
    <div class="page-header animate-fade-up">
      <div>
        <h1>👥 Gestion des utilisateurs</h1>
        <p class="text-secondary">Créer, modifier et supprimer les comptes</p>
      </div>
      <button class="btn btn-primary" id="btn-add-user">+ Nouvel utilisateur</button>
    </div>

    <div class="card glass-card animate-fade-up" style="--delay:2">
      <div class="card-header">
        <div class="filters">
          <select class="form-select form-select-sm" id="filter-role">
            <option value="">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="formateur">Formateur</option>
            <option value="stagiaire">Stagiaire</option>
          </select>
        </div>
      </div>
      <div class="card-body" id="users-table-body">
        <div class="loading-container"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  let allUsers = [];

  /* ─── Load & render table ─────────────────────────── */
  async function load() {
    const tbody = document.getElementById('users-table-body');
    try {
      const role   = document.getElementById('filter-role')?.value;
      const params = role ? `?role=${role}` : '';
      allUsers     = (await users.getAll(params)).data || [];
      renderTable(tbody);
    } catch (err) {
      tbody.innerHTML = `<div class="empty-state"><p>Erreur : ${err.message}</p></div>`;
    }
  }

  function renderTable(el) {
    if (!allUsers.length) {
      el.innerHTML = '<div class="empty-state"><p>Aucun utilisateur trouvé.</p></div>';
      return;
    }
    el.innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Filière</th><th>Statut</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${allUsers.map(u => `
            <tr>
              <td><strong>${u.name}</strong></td>
              <td class="text-secondary">${u.email}</td>
              <td><span class="badge badge-${u.role}">${u.role}</span></td>
              <td>${u.filiere || '—'}</td>
              <td><span class="badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}">${u.isActive !== false ? 'Actif' : 'Inactif'}</span></td>
              <td class="table-actions">
                <button class="btn btn-sm btn-outline" data-action="edit" data-id="${u._id}">Modifier</button>
                <button class="btn btn-sm btn-danger"  data-action="delete" data-id="${u._id}" data-name="${u.name}">Supprimer</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    /* Event delegation */
    el.addEventListener('click', handleTableClick);
  }

  /* ─── Table actions (edit / delete) ───────────────── */
  function handleTableClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id     = btn.dataset.id;

    if (action === 'edit')   showEditModal(id);
    if (action === 'delete') showDeleteModal(id, btn.dataset.name);
  }

  /* ─── Edit modal ──────────────────────────────────── */
  function showEditModal(id) {
    const u = allUsers.find(x => x._id === id);
    if (!u) return;

    openModal(`
      <h2>Modifier l'utilisateur</h2>
      <form id="edit-user-form" class="modal-form">
        <div class="form-group">
          <label class="form-label">Nom</label>
          <input class="form-input" name="name" value="${u.name}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Rôle</label>
          <select class="form-select" name="role">
            <option value="admin"      ${u.role==='admin'?'selected':''}>Admin</option>
            <option value="formateur"  ${u.role==='formateur'?'selected':''}>Formateur</option>
            <option value="stagiaire"  ${u.role==='stagiaire'?'selected':''}>Stagiaire</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Filière</label>
          <input class="form-input" name="filiere" value="${u.filiere || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Statut</label>
          <select class="form-select" name="isActive">
            <option value="true"  ${u.isActive!==false?'selected':''}>Actif</option>
            <option value="false" ${u.isActive===false?'selected':''}>Inactif</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="modal-cancel">Annuler</button>
          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    `);

    document.getElementById('modal-cancel').onclick = closeModal;
    document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await users.update(id, {
          name:     fd.get('name'),
          role:     fd.get('role'),
          filiere:  fd.get('filiere'),
          isActive: fd.get('isActive') === 'true',
        });
        showToast('Utilisateur modifié.', 'success');
        closeModal(); load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  /* ─── Delete confirmation ─────────────────────────── */
  function showDeleteModal(id, name) {
    openModal(`
      <h2>Confirmer la suppression</h2>
      <p style="margin:.75rem 0">Êtes-vous sûr de vouloir supprimer <strong>${name}</strong> ?</p>
      <p class="text-danger" style="font-size:.85rem">Cette action est irréversible.</p>
      <div class="modal-actions">
        <button class="btn btn-outline" id="modal-cancel">Annuler</button>
        <button class="btn btn-danger" id="confirm-del">Supprimer</button>
      </div>
    `);
    document.getElementById('modal-cancel').onclick = closeModal;
    document.getElementById('confirm-del').addEventListener('click', async () => {
      try {
        await users.delete(id);
        showToast('Utilisateur supprimé.', 'success');
        closeModal(); load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  /* ─── Add user modal ──────────────────────────────── */
  document.getElementById('btn-add-user').addEventListener('click', () => {
    openModal(`
      <h2>Nouvel utilisateur</h2>
      <form id="add-user-form" class="modal-form">
        <div class="form-group">
          <label class="form-label">Nom complet</label>
          <input class="form-input" name="name" required placeholder="Mohamed Alami">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" name="email" required placeholder="email@edunotes.com">
        </div>
        <div class="form-group">
          <label class="form-label">Mot de passe</label>
          <input class="form-input" type="password" name="password" required minlength="6" placeholder="Minimum 6 caractères">
        </div>
        <div class="form-group">
          <label class="form-label">Rôle</label>
          <select class="form-select" name="role">
            <option value="stagiaire">Stagiaire</option>
            <option value="formateur">Formateur</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Filière</label>
          <input class="form-input" name="filiere" placeholder="Développement Web">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="modal-cancel">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
    `);

    document.getElementById('modal-cancel').onclick = closeModal;
    document.getElementById('add-user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd   = new FormData(e.target);
      const data = {
        name:     fd.get('name'),
        email:    fd.get('email'),
        password: fd.get('password'),
        role:     fd.get('role'),
        filiere:  fd.get('filiere'),
      };
      try {
        /* Create in auth-service so the user can login */
        const authRes = await auth.register(data);
        /* Also try to create in user-service for listing, keeping _id synced */
        try { 
          if(authRes && authRes.data && authRes.data.id) {
             data._id = authRes.data.id;
          }
          await users.create(data); 
        } catch { /* OK if it fails */ }
        showToast('Utilisateur créé avec succès !', 'success');
        closeModal(); load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  });

  /* ─── Filter ──────────────────────────────────────── */
  document.getElementById('filter-role').addEventListener('change', load);

  /* ─── Initial load ────────────────────────────────── */
  load();
}

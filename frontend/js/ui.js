/**
 * ui.js – Global UI helpers (toast, modal)
 */

/* ═══════════════════════════════════════════════════════
   Toast Notifications
   ═══════════════════════════════════════════════════════ */
const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate-slide-in`;
  toast.innerHTML = `
    <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('animate-slide-out');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ═══════════════════════════════════════════════════════
   Modal
   ═══════════════════════════════════════════════════════ */
function onEscape(e) {
  if (e.key === 'Escape') closeModal();
}

export function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = html;
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('active'));

  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  document.addEventListener('keydown', onEscape);
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');
  setTimeout(() => overlay.classList.add('hidden'), 250);
  document.removeEventListener('keydown', onEscape);
}

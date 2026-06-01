/**
 * api.js – HTTP service layer for all microservices
 */
import { API } from './config.js';
import { getToken, logout } from './auth.js';

/* ─── Generic fetch wrapper ─────────────────────────── */
async function request(baseUrl, endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });

    /* Session expired → force re-login (except for login endpoint itself) */
    if (res.status === 401 && endpoint !== '/auth/login') {
      logout();
      window.location.hash = '#/login';
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);

    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Service indisponible. Vérifiez que les conteneurs sont démarrés.');
    }
    throw err;
  }
}

/* ─── Auth Service (:3001) ──────────────────────────── */
export const auth = {
  login:    (email, password) => request(API.AUTH, '/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data)           => request(API.AUTH, '/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me:       ()               => request(API.AUTH, '/auth/me'),
};

/* ─── User Service (:3002) ──────────────────────────── */
export const users = {
  getAll:   (params = '')    => request(API.USERS, `/users${params}`),
  getById:  (id)             => request(API.USERS, `/users/${id}`),
  create:   (data)           => request(API.USERS, '/users',       { method: 'POST', body: JSON.stringify(data) }),
  update:   (id, data)       => request(API.USERS, `/users/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  delete:   (id)             => request(API.USERS, `/users/${id}`, { method: 'DELETE' }),
};

/* ─── Notes Service (:3003) ─────────────────────────── */
export const notes = {
  add:            (data)     => request(API.NOTES, '/notes',                { method: 'POST', body: JSON.stringify(data) }),
  getByStagiaire: (id)       => request(API.NOTES, `/notes/stagiaire/${id}`),
  getBulletin:    (id)       => request(API.NOTES, `/notes/bulletin/${id}`),
  update:         (id, data) => request(API.NOTES, `/notes/${id}`,          { method: 'PUT',  body: JSON.stringify(data) }),
  delete:         (id)       => request(API.NOTES, `/notes/${id}`,          { method: 'DELETE' }),
};

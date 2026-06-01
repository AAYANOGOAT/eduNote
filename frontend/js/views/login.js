/**
 * views/login.js – Spectacular Blue & White Floating Login
 */
import { auth } from '../api.js';
import { saveAuth } from '../auth.js';
import { showToast } from '../ui.js';

export function renderLogin(container, router) {
  container.innerHTML = `
    <div class="login-wrapper">
      
      <!-- Animated Background Elements -->
      <div class="bg-shape bg-shape-1"></div>
      <div class="bg-shape bg-shape-2"></div>
      <div class="bg-shape bg-shape-3"></div>

      <!-- Main Login Container -->
      <div class="login-container">
        
        <div class="login-showcase animate-fade-up">
          <div class="brand-chip">Excellence Académique</div>
          <h1 class="showcase-title">EduNotes</h1>
          <p class="showcase-desc">
            Gestion Intelligente & Microservices.<br/>
            Une expérience fluide pour les formateurs et les étudiants.
          </p>
        </div>

        <div class="login-form-box animate-fade-up" style="--delay: 2;">
          <div class="login-form-inner">
            <h2 class="login-box-title">Bienvenue</h2>
            <p class="login-box-subtitle">Veuillez vous identifier</p>

            <form id="login-form" class="login-form">
              <div class="form-group">
                <label class="form-label" for="login-email">Adresse email</label>
                <div class="input-wrapper">
                  <span class="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </span>
                  <input class="form-input with-icon" type="email" id="login-email"
                         placeholder="nom@edunotes.com" required autocomplete="email">
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="login-password">Mot de passe</label>
                <div class="input-wrapper">
                  <span class="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input class="form-input with-icon" type="password" id="login-password"
                         placeholder="••••••••" required autocomplete="current-password">
                </div>
              </div>

              <div id="login-error" class="form-error hidden"></div>

              <button type="submit" class="btn btn-primary btn-block login-btn-effect" id="login-btn">
                <span class="btn-text">Se connecter ➔</span>
                <span class="btn-loader hidden"></span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Animated SVG Wave at the bottom -->
      <svg class="login-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path fill="#F4F7FB" fill-opacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,229.3C960,213,1056,171,1152,149.3C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </div>
  `;

  const form     = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    errorDiv.classList.add('hidden');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const result = await auth.login(email, password);
      saveAuth(result.token, result.user);
      showToast(`Bienvenue, ${result.user.name} !`, 'success');
      router.navigate('/dashboard');
    } catch (err) {
      errorDiv.textContent = err.message || 'Identifiants invalides.';
      errorDiv.classList.remove('hidden');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}

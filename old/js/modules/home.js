/**
 * Home page — module 0
 * Landing section, cards, and placeholder content.
 */

import { Module } from './base.js';

export class HomeModule extends Module {
  /**
   * @param {import('../orchestrator.js').orchestrator} orchestrator
   */
  constructor(orchestrator) {
    super({
      id: 0,
      name: 'Home',
      navLabel: 'Inicio',
      navOrder: 0,
    });
    this.orchestrator = orchestrator;
  }

  render() {
    return `
<div class="card gallery">
  <div class="swiper">
    <div class="swiper-wrapper">
      <div class="swiper-slide"><img src="/src/takumi_mod1.jpeg" alt="Photo 1"></div>
      <div class="swiper-slide"><img src="/src/takumi_mod2.jpeg" alt="Photo 2"></div>
      <div class="swiper-slide"><img src="/src/takumi_mod3.jpeg" alt="Photo 3"></div>
      <div class="swiper-slide"><img src="/src/takumi_mod1.jpeg" alt="Photo 4"></div>
      <div class="swiper-slide"><img src="/src/takumi_mod2.jpeg" alt="Photo 5"></div>
      <div class="swiper-slide"><img src="/src/takumi_mod3.jpeg" alt="Photo 6"></div>
    </div>
  </div>
  <div id="controles">
    <div class="swiper-pagination"></div>
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
    <div class="swiper-scrollbar"></div>
  </div>
</div>

<section class="hero" aria-labelledby="hero-title">
  <h1 id="hero-title">Maximizá tu espacio con camas funcionales e inteligentes</h1>
  <p>Diseño, organización y descanso sin intermediarios. Calidad garantizada para tu hogar.</p>
  <div class="hero__actions">
    <button type="button" class="btn btn--primary" data-go="1">
      Explore Section 1
    </button>
    <button type="button" class="btn btn--secondary" data-go="99">
      Open Settings
    </button>
  </div> 
</section>

<h2 class="sr-only">Feature cards</h2>
<div class="card-grid">
  <article class="card">
    <div class="card__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M80-80v-481l280-119v80l200-80v120h320v480H80Zm80-80h640v-320H480v-82l-200 80v-78l-120 53v347Zm280-80h80v-160h-80v160Zm-160 0h80v-160h-80v160Zm320 0h80v-160h-80v160Zm280-320H680l40-320h120l40 320ZM160-160h640-640Z"/></svg></div>
    <h3>Directo de Fábrica</h3>
    <p>
      Sin intermediarios ni comisiones de revendedores.
    </p>
    <span class="card__meta">-</span>
  </article>
  <article class="card">
    <div class="card__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-80q-33 0-56.5-23.5T120-160v-451q-18-11-29-28.5T80-680v-120q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v120q0 23-11 40.5T840-611v451q0 33-23.5 56.5T760-80H200Zm0-520v440h560v-440H200Zm-40-80h640v-120H160v120Zm200 280h240v-80H360v80Zm120 20Z"/></svg></div>
    <h3>Módulos Inteligentes</h3>
    <p>
      Espacio integrado para ropa, calzado y blanquería.
    </p>
    <span class="card__meta">-</span>
  </article>
  <article class="card">
    <div class="card__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-480Zm0 400q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 10-.5 20t-1.5 20q-9-2-18.5-3t-19.5-1q-11 0-21 1t-21 3q1-10 1.5-19.5t.5-20.5v-189l-240-90-240 90v189q0 121 68 220t172 132q21-7 41-17t39-23v94q-19 10-39 17.5T480-80Zm194 0q-14 0-24-10t-10-24v-132q0-14 10-24t24-10h6v-40q0-33 23.5-56.5T760-400q33 0 56.5 23.5T840-320v40h6q14 0 24 10t10 24v132q0 14-10 24t-24 10H674Zm46-200h80v-40q0-17-11.5-28.5T760-360q-17 0-28.5 11.5T720-320v40Z"/></svg></div>
    <h3>Garantía Directa</h3>
    <p>
      Estructuras reforzadas con respaldo de taller.
    </p>
    <span class="card__meta">-</span>
  </article>
</div>

<div class="content-block">
  <div class="contact-card p-5 rounded-4 shadow-lg glass-card border border-white border-opacity-10">
    <h5 class="mb-4 fw-bold contact-title">Contactanos</h5>
    
    <div class="contact-method mb-4">
      <!-- Email Link -->
      <div class="contact-info mb-3">
        <a href="mailto:info@takumihogar.com" class="contact-link">
          <span class="contact-method-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </span>
          <div>
            <small class="d-block text-light opacity-75">Correo Electrónico</small>
            <span class="text-light">info@takumihogar.com</span>
          </div>
        </a>
      </div>

      <!-- WhatsApp Link -->
      <div class="contact-info">
        <a href="https://wa.me/5491234567890" target="_blank" class="contact-link">
          <span class="contact-method-icon icon-whatsapp">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/>
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>
            </svg>
          </span>
          <div>
            <small class="d-block text-light opacity-75">WhatsApp</small>
            <span class="text-light">+54 9 1234 567890</span>
          </div>
        </a>
      </div>
    </div>

    <div class="divider mb-4"></div>

    <!-- Social Section -->
    <div class="social-section">
      <p class="small text-light opacity-75 mb-3">Seguinos en redes</p>
      <div class="social-icons d-flex gap-2">
        <a href="https://facebook.com/takumihogar" target="_blank" class="social-btn" title="Facebook" aria-label="Facebook">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
        </a>
        <a href="https://instagram.com/takumihogar" target="_blank" class="social-btn" title="Instagram" aria-label="Instagram">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
          </svg>
        </a>
      </div>
    </div>
  </div>
</div>

<footer class="module-footer">
  Takumi · Home · 2026
</footer>
    `;
  }

  afterMount() {
    if (!this.element) return;
    this.element.addEventListener('click', (e) => {
      const btn = e.target instanceof HTMLElement ? e.target.closest('[data-go]') : null;
      if (!btn) return;
      const id = Number(btn.getAttribute('data-go'));
      if (!Number.isNaN(id)) this.orchestrator.show(id);
    });
  }
}

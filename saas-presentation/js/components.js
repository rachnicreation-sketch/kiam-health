/* ═══════════════════════════════════════════════════════════════
   KIAM — Shared Components (Header, Footer, Mobile Menu)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Determine the base path to root based on current page depth.
 * Pages in subdirectories (e.g., solutions/) need "../" prefix.
 */
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/solutions/')) return '../';
  return '';
}

/**
 * Get the current page identifier for nav highlighting.
 */
function getCurrentPage() {
  const path = window.location.pathname;
  const file = path.split('/').pop() || 'index.html';
  if (file === '' || file === 'index.html') return 'home';
  if (path.includes('/solutions/')) return 'solutions';
  return file.replace('.html', '');
}

/**
 * Inject header into #site-header placeholder.
 */
function loadHeader() {
  const base = getBasePath();
  const current = getCurrentPage();
  const isActive = (page) => current === page ? ' active' : '';

  const solutionItems = [
    { key: 'health', icon: '🏥', name: 'Kiam Health', desc: 'Dossiers médicaux, consultations & assurances', color: 'var(--health)', file: 'health.html' },
    { key: 'commerce', icon: '🛒', name: 'Kiam ERP', desc: 'POS, stocks multi-dépôts & relation client', color: 'var(--commerce)', file: 'erp.html' },
    { key: 'school', icon: '🎓', name: 'Kiam School', desc: 'Notes, bulletins, scolarité & portail parents', color: 'var(--school)', file: 'school.html' },
    { key: 'hotel', icon: '🏨', name: 'Kiam Hotel', desc: 'Réservations, housekeeping & channel manager', color: 'var(--hotel)', file: 'hotel.html' },
    { key: 'pharmacy', icon: '💊', name: 'Kiam Pharmacy', desc: 'Dispensation, péremptions & registre stupéfiants', color: 'var(--pharmacy)', file: 'pharmacy.html' },
    { key: 'enterprise', icon: '🏢', name: 'Kiam Enterprise', desc: 'Gestion de projets, feuilles de temps & GED', color: 'var(--enterprise)', file: 'enterprise.html' }
  ];

  const dropdownItems = solutionItems.map(s => `
    <a href="${base}solutions/${s.file}" class="nav-dropdown-item">
      <div class="nav-dropdown-item-title" style="color:${s.color}">${s.icon} ${s.name}</div>
      <div class="nav-dropdown-item-desc">${s.desc}</div>
    </a>
  `).join('');

  const mobileSubLinks = solutionItems.map(s => `
    <a href="${base}solutions/${s.file}">${s.icon} ${s.name}</a>
  `).join('');

  const header = document.getElementById('site-header');
  if (!header) return;

  header.innerHTML = `
    <div class="header-inner">
      <a href="${base}index.html" class="logo">
        <span class="logo-icon">K</span>
        <span class="logo-text">Kiam</span>
      </a>

      <nav class="nav-links">
        <a href="${base}index.html" class="nav-link${isActive('home')}">Accueil</a>
        <div class="nav-dropdown">
          <a href="${base}solutions.html" class="nav-link nav-dropdown-trigger${isActive('solutions')}">Solutions ▾</a>
          <div class="nav-dropdown-menu">${dropdownItems}</div>
        </div>
        <a href="${base}pricing.html" class="nav-link${isActive('pricing')}">Tarifs</a>
        <a href="${base}demo.html" class="nav-link${isActive('demo')}">Démo</a>
        <a href="${base}about.html" class="nav-link${isActive('about')}">À propos</a>
        <a href="${base}blog.html" class="nav-link${isActive('blog')}">Blog</a>
        <a href="${base}contact.html" class="nav-link${isActive('contact')}">Contact</a>
      </nav>

      <div class="header-actions">
        <a href="${base}login.html" class="header-login">Connexion</a>
        <a href="${base}register.html" id="nav-cta" class="btn btn-primary btn-sm sector-transition">Essai gratuit</a>
      </div>

      <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Menu">
        <span class="hamburger-line"></span>
      </button>
    </div>

    <div class="mobile-menu" id="mobile-menu">
      <a href="${base}index.html" class="mobile-menu-link">Accueil</a>
      <div>
        <a href="${base}solutions.html" class="mobile-menu-link">Solutions</a>
        <div class="mobile-menu-sub">${mobileSubLinks}</div>
      </div>
      <a href="${base}pricing.html" class="mobile-menu-link">Tarifs</a>
      <a href="${base}demo.html" class="mobile-menu-link">Démo</a>
      <a href="${base}about.html" class="mobile-menu-link">À propos</a>
      <a href="${base}blog.html" class="mobile-menu-link">Blog</a>
      <a href="${base}contact.html" class="mobile-menu-link">Contact</a>
      <a href="${base}partners.html" class="mobile-menu-link">Partenaires</a>
      <a href="${base}faq.html" class="mobile-menu-link">FAQ</a>
      <hr class="divider" style="margin:1.5rem 0">
      <a href="${base}login.html" class="mobile-menu-link">Connexion</a>
      <a href="${base}register.html" class="btn btn-primary btn-block" style="margin-top:0.5rem">Essai gratuit</a>
    </div>
  `;
}

/**
 * Inject footer into #site-footer placeholder.
 */
function loadFooter() {
  const base = getBasePath();
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-grid">
      <div>
        <p class="footer-col-title">Produits</p>
        <a href="${base}solutions/health.html" class="footer-link">Kiam Health</a>
        <a href="${base}solutions/erp.html" class="footer-link">Kiam ERP</a>
        <a href="${base}solutions/school.html" class="footer-link">Kiam School</a>
        <a href="${base}solutions/hotel.html" class="footer-link">Kiam Hotel</a>
        <a href="${base}solutions/pharmacy.html" class="footer-link">Kiam Pharmacy</a>
        <a href="${base}solutions/enterprise.html" class="footer-link">Kiam Enterprise</a>
      </div>
      <div>
        <p class="footer-col-title">Ressources</p>
        <a href="${base}pricing.html" class="footer-link">Tarifs</a>
        <a href="${base}demo.html" class="footer-link">Demander une démo</a>
        <a href="${base}blog.html" class="footer-link">Blog & Actualités</a>
        <a href="${base}faq.html" class="footer-link">FAQ</a>
        <a href="${base}partners.html" class="footer-link">Partenaires</a>
      </div>
      <div>
        <p class="footer-col-title">Entreprise</p>
        <a href="${base}about.html" class="footer-link">À propos</a>
        <a href="${base}contact.html" class="footer-link">Contact</a>
        <a href="${base}login.html" class="footer-link">Connexion</a>
        <a href="${base}register.html" class="footer-link">Inscription</a>
      </div>
      <div>
        <p class="footer-col-title">Légal</p>
        <a href="${base}privacy.html" class="footer-link">Confidentialité</a>
        <a href="${base}terms.html" class="footer-link">Conditions d'utilisation</a>
        <div style="margin-top:1.5rem">
          <p class="footer-col-title">Langue</p>
          <p style="font-family:'IBM Plex Mono',monospace;font-size:0.75rem;color:var(--muted)">🇫🇷 Français</p>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} Kiam SaaS. Tous droits réservés.</p>
      <p>Afrique de l'Ouest & Centrale</p>
    </div>
  `;
}

/**
 * Toggle mobile menu visibility.
 */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.querySelector('.mobile-menu-btn');
  if (menu && btn) {
    menu.classList.toggle('open');
    btn.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  }
}

/**
 * Initialize shared components on page load.
 */
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  loadFooter();
});

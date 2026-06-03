/**
 * Scripts Globaux - KIAM Caisse
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialiser le thème de couleur
    initTheme();

    // 2. Initialiser la Sidebar Responsive
    initSidebar();

    // 3. Initialiser les Fermetures Modales
    initModals();
});

/**
 * Initialisation et gestion du thème Sombre / Clair
 */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (!themeToggleBtn) return;

    // Déterminer le thème initial
    const savedTheme = localStorage.getItem('kiam_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    // Appliquer le thème
    document.documentElement.setAttribute('data-theme', initialTheme);
    updateThemeIcon(initialTheme);

    // Écouter le clic sur le bouton de bascule
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('kiam_theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Notification subtile
        showNotification(`Thème ${newTheme === 'dark' ? 'Sombre' : 'Clair'} activé`, 'success');
    });
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    
    // Mettre à jour l'icône SVG à l'intérieur
    if (theme === 'dark') {
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        `;
    } else {
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
    }
}

/**
 * Gestion de la barre latérale sur mobile
 */
function initSidebar() {
    const menuToggleBtn = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggleBtn && sidebar) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
        
        // Fermer la sidebar en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== menuToggleBtn) {
                sidebar.classList.remove('active');
            }
        });
    }
}

/**
 * Modals Helper : Fermeture automatique de toutes les modales
 */
function initModals() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Clic sur le fond = fermer
        modal.addEventListener('click', function(e) {
            // Vérifier que c'est bien un clic sur le fond (la modale elle-même), pas sur le contenu
            if (e.target.classList.contains('modal')) {
                closeModal(this.id);
            }
        });
        
        // Boutons de fermeture - utiliser la délégation d'événements
        const closeBtns = modal.querySelectorAll('.modal-close');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const modalId = modal.id;
                closeModal(modalId);
            }, true); // Utiliser la phase de capture pour intercepter plus tôt
        });
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.warn(`Modal #${modalId} not found`);
        return;
    }
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.warn(`Modal #${modalId} not found`);
        return;
    }
    modal.classList.remove('active');
}

/**
 * Système de Notification Custom (Toast)
 * @param {string} message Le texte à afficher
 * @param {string} type 'success', 'danger', 'warning', 'info'
 */
function showNotification(message, type = 'info') {
    // Vérifier si le conteneur existe, sinon le créer
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    // Créer la notification (toast)
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Déterminer la couleur de bordure/fond basée sur le type
    let color = 'var(--accent)';
    let icon = 'ℹ️';
    if (type === 'success') { color = 'var(--success)'; icon = '✓'; }
    if (type === 'danger') { color = 'var(--danger)'; icon = '✕'; }
    if (type === 'warning') { color = 'var(--warning)'; icon = '⚠'; }

    toast.style.cssText = `
        background-color: var(--bg-secondary);
        border-left: 4px solid ${color};
        color: var(--text-primary);
        padding: 12px 20px;
        border-radius: var(--border-radius-md);
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: var(--font-primary);
        font-size: 0.9rem;
        font-weight: 500;
        min-width: 250px;
        max-width: 350px;
        pointer-events: auto;
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;

    toast.innerHTML = `
        <span style="color: ${color}; font-weight: 700; font-size: 1.1rem;">${icon}</span>
        <span style="flex-grow: 1;">${message}</span>
        <button style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size: 0.8rem;" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Déclencher l'animation d'entrée après un court instant
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Supprimer automatiquement après 4 secondes
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

/**
 * Odoo-like View Switcher (Kanban vs List)
 */
function switchErpView(viewType) {
    const kanbanView = document.getElementById('erp-view-kanban');
    const listView = document.getElementById('erp-view-list');
    const kanbanBtn = document.getElementById('btn-view-kanban');
    const listBtn = document.getElementById('btn-view-list');

    if (!kanbanView || !listView) return;

    if (viewType === 'kanban') {
        kanbanView.style.display = 'grid';
        listView.style.display = 'none';
        
        if (kanbanBtn) kanbanBtn.classList.add('active');
        if (listBtn) listBtn.classList.remove('active');
    } else {
        kanbanView.style.display = 'none';
        listView.style.display = 'block';
        
        if (kanbanBtn) kanbanBtn.classList.remove('active');
        if (listBtn) listBtn.classList.add('active');
    }
}

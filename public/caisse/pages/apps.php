<?php
/**
 * Lanceur d'Applications (App Grid) - KIAM ERP
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

requireLogin();

$userRole = $_SESSION['user_role'] ?? '';
$isAdminOrManager = in_array($userRole, ['admin', 'manager']);

$apps = [
    ['id' => 'pos', 'name' => 'Point de Vente', 'icon' => 'shopping-cart', 'url' => 'pos.php', 'color' => '#0066cc', 'desc' => 'Gérer les transactions'],
    ['id' => 'inventory', 'name' => 'Inventaire', 'icon' => 'package', 'url' => 'index.php?page=products', 'color' => '#66dd00', 'desc' => 'Gérer les stocks', 'allowed' => $isAdminOrManager],
    ['id' => 'contacts', 'name' => 'Contacts', 'icon' => 'users', 'url' => 'index.php?page=clients', 'color' => '#00ccff', 'desc' => 'Clients & fournisseurs', 'allowed' => $isAdminOrManager],
    ['id' => 'accounting', 'name' => 'Comptabilité', 'icon' => 'bar-chart-2', 'url' => 'index.php?page=accounting', 'color' => '#003d99', 'desc' => 'Finances & comptes', 'allowed' => in_array($userRole, ['admin', 'manager', 'comptable'])],
    ['id' => 'dashboard', 'name' => 'Rapports', 'icon' => 'trending-up', 'url' => 'index.php?page=reports', 'color' => '#0099ff', 'desc' => 'Analyses & tendances', 'allowed' => in_array($userRole, ['admin', 'manager', 'comptable'])],
    ['id' => 'users', 'name' => 'Employés', 'icon' => 'user-check', 'url' => 'index.php?page=users', 'color' => '#1aad1a', 'desc' => 'Gestion RH', 'allowed' => in_array($userRole, ['admin', 'manager', 'rh'])],
    ['id' => 'suppliers', 'name' => 'Fournisseurs', 'icon' => 'truck', 'url' => 'index.php?page=suppliers', 'color' => '#00a8e8', 'desc' => 'Achats & commandes', 'allowed' => $isAdminOrManager],
    ['id' => 'expenses', 'name' => 'Dépenses', 'icon' => 'wallet', 'url' => 'index.php?page=expenses', 'color' => '#99ff33', 'desc' => 'Suivi des dépenses', 'allowed' => $isAdminOrManager],
    ['id' => 'settings', 'name' => 'Paramètres', 'icon' => 'settings', 'url' => 'index.php?page=settings', 'color' => '#004080', 'desc' => 'Configuration', 'allowed' => $userRole === 'admin']
];

// Ajouter allowed à tous les apps
foreach ($apps as &$app) {
    if (!isset($app['allowed'])) $app['allowed'] = true;
}
?>

<!-- Section Banner d'accueil -->
<div style="background: linear-gradient(135deg, #0066cc 0%, #00a8e8 50%, #66dd00 100%); color: white; border-radius: 12px; padding: 40px; margin-bottom: 50px; text-align: center; box-shadow: 0 10px 30px rgba(0, 102, 204, 0.3);">
    <h1 style="margin: 0 0 15px 0; font-size: 2.5rem; font-weight: 700;">Bienvenue 👋</h1>
    <p style="margin: 0; font-size: 1.1rem; opacity: 0.95;">
        <?php 
        $name = htmlspecialchars($_SESSION['user_name'] ?? 'Utilisateur');
        echo "$name • <span style='font-weight: 500; text-transform: capitalize;'>" . htmlspecialchars($userRole) . "</span>";
        ?>
    </p>
</div>

<!-- Grille des applications -->
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 20px; max-width: 1300px; padding: 0 10px;">
    <?php foreach ($apps as $app): ?>
        <?php if ($app['allowed']): ?>
            <a href="<?php echo htmlspecialchars($app['url']); ?>" style="text-decoration: none;">
                <div style="background: white; border-radius: 12px; padding: 22px 15px; text-align: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.06); border-top: 4px solid <?php echo htmlspecialchars($app['color']); ?>; min-height: 135px; display: flex; flex-direction: column; justify-content: space-between; align-items: center;" onmouseover="this.style.boxShadow='0 12px 24px rgba(0,0,0,0.12)'; this.style.transform='translateY(-4px)'" onmouseout="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.06)'; this.style.transform='translateY(0)'">
                    
                    <!-- Icone SVG Centrée et Dimensionnée -->
                    <div style="width: 42px; height: 42px; margin: 0 auto 10px auto; color: <?php echo htmlspecialchars($app['color']); ?>; display: flex; align-items: center; justify-content: center;">
                        <?php echo getSVGIcon($app['icon']); ?>
                    </div>
                    
                    <!-- Titre de l'app -->
                    <h3 style="margin: 0 0 6px 0; font-size: 1rem; color: #1F2937; font-weight: 600;">
                        <?php echo htmlspecialchars($app['name']); ?>
                    </h3>
                    
                    <!-- Description -->
                    <p style="margin: 0; font-size: 0.8rem; color: #9CA3AF; line-height: 1.2;">
                        <?php echo htmlspecialchars($app['desc'] ?? ''); ?>
                    </p>
                </div>
            </a>
        <?php endif; ?>
    <?php endforeach; ?>
</div>

<?php
/**
 * Fonction pour retourner les icônes SVG Lucide-like
 */
function getSVGIcon($name) {
    $svgs = [
        'shopping-cart' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
        
        'package' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
        
        'users' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        
        'bar-chart-2' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
        
        'trending-up' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
        
        'user-check' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>',
        
        'truck' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;"><rect x="1" y="6" width="15" height="11"></rect><rect x="16" y="6" width="6" height="11"></rect><circle cx="5.5" cy="19.5" r="2.5"></circle><circle cx="18.5" cy="19.5" r="2.5"></circle></svg>',
        
        'wallet' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><path d="M1 10h22"></path><circle cx="17" cy="14" r="2"></circle></svg>',
        
        'settings' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m3.08-3.08l4.24-4.24"></path></svg>'
    ];
    
    return $svgs[$name] ?? '📱';
}
?>

<style>
    /* Animations supplémentaires */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    a {
        animation: fadeInUp 0.5s ease-out forwards;
    }
    
    a:nth-child(1) { animation-delay: 0.05s; }
    a:nth-child(2) { animation-delay: 0.1s; }
    a:nth-child(3) { animation-delay: 0.15s; }
    a:nth-child(4) { animation-delay: 0.2s; }
    a:nth-child(5) { animation-delay: 0.25s; }
    a:nth-child(6) { animation-delay: 0.3s; }
    a:nth-child(7) { animation-delay: 0.35s; }
    a:nth-child(8) { animation-delay: 0.4s; }
    a:nth-child(9) { animation-delay: 0.45s; }
</style>
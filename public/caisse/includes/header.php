<?php
/**
 * En-tête ERP - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Protection globale
requireLogin();

$page = $_GET['page'] ?? 'apps';
$pageTitle = $pageTitle ?? 'Applications';
$currentUser = getCurrentUser();

$shopName = 'KIAM ERP';
$shopSettings = null;

if (($currentUser['role'] ?? '') !== 'super_admin') {
    try {
        $settingsStmt = $pdo->query("SELECT * FROM settings LIMIT 1");
        $shopSettings = $settingsStmt->fetch();
        $shopName = $shopSettings['company_name'] ?? 'KIAM ERP';
    } catch (Exception $e) {
        // Fallback si la table n'est pas encore prête
    }
} else {
    $shopName = 'KIAM SaaS Admin';
}
?>
<!DOCTYPE html>
<html lang="fr" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($pageTitle); ?> - <?php echo htmlspecialchars($shopName); ?></title>
    <!-- Google Fonts Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Styles Globaux -->
    <link rel="stylesheet" href="assets/css/style.css">
    <!-- Nouveaux Styles ERP Odoo-like -->
    <link rel="stylesheet" href="assets/css/erp.css">
    <!-- Scripts Globaux -->
    <script src="assets/js/kiam_global.js" defer></script>
</head>
<body class="erp-mode">

<!-- Barre de Navigation Supérieure (Top-Nav) -->
<div class="erp-topbar">
    <a href="index.php?page=apps" class="erp-app-switcher" title="Lanceur d'applications">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>
    </a>
    <a href="index.php?page=apps" class="erp-brand">
        <?php if (!empty($shopSettings['company_logo'])): ?>
            <img src="<?php echo htmlspecialchars($shopSettings['company_logo']); ?>" alt="Logo" style="height: 24px; margin-right: 8px; vertical-align: middle; border-radius: 4px;">
        <?php endif; ?>
        <?php echo htmlspecialchars($shopName); ?>
    </a>
    
    <div class="erp-nav-links">
        <?php if ($page !== 'apps'): ?>
            <span style="color:white; opacity:0.9; margin-left: 15px; font-weight:500; display:flex; align-items:center;"><?php echo htmlspecialchars($pageTitle); ?></span>
        <?php endif; ?>
    </div>
    
    <div class="erp-topbar-right">
        <!-- Raccourci Caisse Rapide (POS) -->
        <a href="pos.php" title="Aller à la Caisse" style="color: white; margin-right: 15px; display: flex; align-items: center; opacity: 0.8; transition: 0.2s;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;"><rect x="2" y="4" width="20" height="8" rx="2" ry="2"></rect><rect x="6" y="20" width="12" height="4" rx="1" ry="1"></rect><path d="M2 12h20M7 16h10M12 12v4"></path></svg>
        </a>
        
        <!-- Menu Utilisateur -->
        <div class="erp-user-menu" onclick="window.location.href='logout.php'" title="Se Déconnecter">
            <div class="erp-user-avatar"><?php echo strtoupper(substr($currentUser['name'] ?? 'U', 0, 1)); ?></div>
            <span style="color: white;"><?php echo htmlspecialchars($currentUser['name'] ?? 'Utilisateur'); ?></span>
        </div>
    </div>
</div>

<!-- Conteneur Principal -->
<div class="erp-layout">
    <?php if ($page !== 'apps'): ?>
        <!-- Barre Latérale Contextuelle (seulement si on est dans une application) -->
        <?php include_once __DIR__ . '/sidebar.php'; ?>
    <?php endif; ?>
    
    <!-- Zone de Contenu Dynamique -->
    <div class="erp-main">
        <?php if ($page !== 'apps'): ?>
        <!-- Panneau de Contrôle ERP (Breadcrumbs) -->
        <div class="erp-control-panel">
            <div class="erp-breadcrumbs">
                <a href="index.php?page=apps" class="app-name"><?php echo htmlspecialchars($pageTitle); ?></a>
            </div>
            <div class="erp-actions" id="erp-page-actions">
                <!-- Les boutons d'actions contextuels (ex: Créer) s'injecteront ici -->
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Contenu de la Vue -->
        <div class="erp-view-content" style="padding: <?php echo $page === 'apps' ? '0' : '20px'; ?>;">

<?php
/**
 * Barre Latérale Contextuelle (Sidebar ERP) - KIAM Caisse
 */

$currentPage = $_GET['page'] ?? 'apps';
$userRole = $_SESSION['user_role'] ?? '';

// Déterminer l'application active pour afficher le bon menu
$activeApp = '';
if ($userRole === 'super_admin') {
    $activeApp = 'saas';
} elseif (in_array($currentPage, ['products', 'stock'])) $activeApp = 'inventory';
elseif (in_array($currentPage, ['clients', 'suppliers'])) $activeApp = 'contacts';
elseif (in_array($currentPage, ['expenses', 'reports'])) $activeApp = 'accounting';
elseif ($currentPage === 'dashboard') $activeApp = 'dashboard';
elseif (in_array($currentPage, ['settings', 'users'])) $activeApp = 'settings';
elseif ($currentPage === 'payroll') $activeApp = 'payroll';
?>
<aside class="erp-sidebar">
    
    <?php if ($activeApp === 'saas'): ?>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Administration SaaS</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=saas_dashboard" class="<?php echo $currentPage === 'saas_dashboard' ? 'active' : ''; ?>">Gestion Locataires</a>
            </div>
        </div>

    <?php elseif ($activeApp === 'inventory'): ?>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Catalogue</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=products" class="<?php echo $currentPage === 'products' ? 'active' : ''; ?>">Articles & Produits</a>
            </div>
        </div>
        <?php if (in_array($userRole, ['admin', 'manager'])): ?>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Opérations</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=stock" class="<?php echo $currentPage === 'stock' ? 'active' : ''; ?>">Mouvements de Stock</a>
            </div>
        </div>
        <?php endif; ?>

    <?php elseif ($activeApp === 'contacts'): ?>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Répertoire</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=clients" class="<?php echo $currentPage === 'clients' ? 'active' : ''; ?>">Clients</a>
                <?php if (in_array($userRole, ['admin', 'manager'])): ?>
                    <a href="index.php?page=suppliers" class="<?php echo $currentPage === 'suppliers' ? 'active' : ''; ?>">Fournisseurs</a>
                <?php endif; ?>
            </div>
        </div>

    <?php elseif ($activeApp === 'accounting'): ?>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Finances</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=accounting" class="<?php echo $currentPage === 'accounting' ? 'active' : ''; ?>">Comptabilité Complète</a>
                <a href="index.php?page=expenses" class="<?php echo $currentPage === 'expenses' ? 'active' : ''; ?>">Charges & Dépenses</a>
            </div>
        </div>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Analyses</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=reports" class="<?php echo $currentPage === 'reports' ? 'active' : ''; ?>">Compte de Résultat</a>
            </div>
        </div>

    <?php elseif (in_array($currentPage, ['expenses', 'reports'])): ?>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Finances</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=accounting" class="<?php echo $currentPage === 'accounting' ? 'active' : ''; ?>">Comptabilité Complète</a>
                <a href="index.php?page=expenses" class="<?php echo $currentPage === 'expenses' ? 'active' : ''; ?>">Charges & Dépenses</a>
            </div>
        </div>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Analyses</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=reports" class="<?php echo $currentPage === 'reports' ? 'active' : ''; ?>">Compte de Résultat</a>
            </div>
        </div>

    <?php elseif ($activeApp === 'dashboard'): ?>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Vue d'ensemble</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=dashboard" class="<?php echo $currentPage === 'dashboard' ? 'active' : ''; ?>">KPIs & Synthèse</a>
            </div>
        </div>

    <?php elseif ($activeApp === 'settings'): ?>
        <?php if ($userRole === 'admin'): ?>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Configuration Globale</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=settings" class="<?php echo $currentPage === 'settings' ? 'active' : ''; ?>">Paramètres Boutique</a>
            </div>
        </div>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Sécurité</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=users" class="<?php echo $currentPage === 'users' ? 'active' : ''; ?>">Gérer les Utilisateurs</a>
            </div>
        </div>
        <?php endif; ?>
        
    <?php elseif ($activeApp === 'payroll'): ?>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Ressources Humaines</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=payroll&tab=dashboard" class="payroll-nav-link" id="nav-payroll-dashboard">Tableau de Bord</a>
                <a href="index.php?page=payroll&tab=employees" class="payroll-nav-link" id="nav-payroll-employees">Employés & Contrats</a>
                <a href="index.php?page=payroll&tab=timesheet" class="payroll-nav-link" id="nav-payroll-timesheet">Présences & Horaires</a>
            </div>
        </div>
        <div class="erp-sidebar-group">
            <div class="erp-sidebar-title">Rémunérations & Paie</div>
            <div class="erp-sidebar-nav">
                <a href="index.php?page=payroll&tab=advances" class="payroll-nav-link" id="nav-payroll-advances">Avances & Primes</a>
                <a href="index.php?page=payroll&tab=payslips" class="payroll-nav-link" id="nav-payroll-payslips">Calculs de Paie</a>
                <a href="index.php?page=payroll&tab=settings" class="payroll-nav-link" id="nav-payroll-settings">Configuration</a>
            </div>
        </div>
        
    <?php endif; ?>

</aside>

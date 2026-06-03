<?php
/**
 * Routeur Principal et Point d'Entrée - KIAM Caisse
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';

// Protection globale : Requiert d'être connecté
requireLogin();

$userRole = $_SESSION['user_role'] ?? '';

// Si Super Admin, forcer l'accès uniquement au tableau de bord SaaS
if ($userRole === 'super_admin') {
    $page = $_GET['page'] ?? 'saas_dashboard';
    if ($page !== 'saas_dashboard') {
        header('Location: index.php?page=saas_dashboard');
        exit;
    }
} else {
    // Récupérer le nom de la page à charger pour les autres utilisateurs
    $page = $_GET['page'] ?? 'apps';
}

// Liste blanche des pages autorisées pour bloquer toute faille de sécurité LFI (Local File Inclusion)
$allowedPages = [
    'saas_dashboard' => ['title' => 'Administration SaaS', 'file' => 'saas_dashboard.php', 'roles' => ['super_admin']],
    'apps' => ['title' => 'Applications', 'file' => 'apps.php', 'roles' => ['admin', 'manager', 'cashier', 'rh', 'comptable']],
    'dashboard' => ['title' => 'Tableau de Bord', 'file' => 'dashboard.php', 'roles' => ['admin', 'manager', 'cashier']],
    'products' => ['title' => 'Produits & Catalogues', 'file' => 'products.php', 'roles' => ['admin', 'manager', 'cashier']],
    'stock' => ['title' => 'Mouvements de Stocks', 'file' => 'stock.php', 'roles' => ['admin', 'manager']],
    'clients' => ['title' => 'Gestion Clients', 'file' => 'clients.php', 'roles' => ['admin', 'manager', 'cashier']],
    'suppliers' => ['title' => 'Fournisseurs & Achats', 'file' => 'suppliers.php', 'roles' => ['admin', 'manager']],
    'expenses' => ['title' => 'Suivi Dépenses', 'file' => 'expenses.php', 'roles' => ['admin', 'manager']],
    'reports' => ['title' => 'Rapports & Bilans', 'file' => 'reports.php', 'roles' => ['admin', 'manager']],
    'accounting' => ['title' => 'Comptabilité Complète', 'file' => 'accounting.php', 'roles' => ['admin', 'manager', 'comptable']],
    'settings' => ['title' => 'Paramètres Boutique', 'file' => 'settings.php', 'roles' => ['admin']],
    'users' => ['title' => 'Gestion Utilisateurs', 'file' => 'users.php', 'roles' => ['admin']],
    'payroll' => ['title' => 'Sage Paie & RH', 'file' => 'payroll.php', 'roles' => ['admin', 'manager', 'rh', 'comptable']],
];

// Vérifier si la page existe dans la liste blanche
if (!array_key_exists($page, $allowedPages)) {
    header("HTTP/1.0 404 Not Found");
    $pageTitle = 'Page Introuvable';
    include_once __DIR__ . '/includes/header.php';
    echo "
        <div class='card' style='text-align: center; padding: 50px;'>
            <h2 style='color: var(--danger); font-size: 2rem; margin-bottom: 10px;'>Erreur 404</h2>
            <p style='color: var(--text-secondary); margin-bottom: 20px;'>La page demandée n'existe pas dans le système.</p>
            <a href='index.php' class='btn btn-primary'>Retour au Tableau de Bord</a>
        </div>
    ";
    include_once __DIR__ . '/includes/footer.php';
    exit;
}

$pageData = $allowedPages[$page];

// Vérifier si l'utilisateur a les droits pour accéder à cette page spécifique
$userRole = $_SESSION['user_role'] ?? '';
if (!in_array($userRole, $pageData['roles'])) {
    $pageTitle = 'Accès Non Autorisé';
    include_once __DIR__ . '/includes/header.php';
    echo "
        <div class='card' style='text-align: center; padding: 50px;'>
            <h2 style='color: var(--danger); font-size: 2rem; margin-bottom: 10px;'>Accès Restreint</h2>
            <p style='color: var(--text-secondary); margin-bottom: 20px;'>Désolé, votre rôle (<strong>" . getRoleLabel($userRole) . "</strong>) ne possède pas les autorisations nécessaires pour voir cette page.</p>
            <a href='index.php' class='btn btn-primary'>Retour au Tableau de Bord</a>
        </div>
    ";
    include_once __DIR__ . '/includes/footer.php';
    exit;
}

// Configurer le titre de la page pour le header
$pageTitle = $pageData['title'];

// Définir les scripts JavaScript spécifiques à charger dans le pied de page
$pageJavascript = '';
if ($page === 'dashboard') {
    $pageJavascript = 'assets/js/dashboard.js';
}

// Si c'est une requête AJAX, charger uniquement le fichier de la page et arrêter le script
if (isset($_GET['ajax']) && $_GET['ajax'] === '1') {
    include_once __DIR__ . '/pages/' . $pageData['file'];
    exit;
}

// Charger la page avec le layout
include_once __DIR__ . '/includes/header.php';

// Charger le contenu métier spécifique
include_once __DIR__ . '/pages/' . $pageData['file'];

include_once __DIR__ . '/includes/footer.php';
?>

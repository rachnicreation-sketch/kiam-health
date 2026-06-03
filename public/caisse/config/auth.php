<?php
/**
 * Gestion de l'Authentification et des Autorisations - KIAM Caisse
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Vérifie si l'utilisateur est connecté
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Restreint l'accès aux utilisateurs connectés uniquement
 */
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

/**
 * Restreint l'accès à un ou plusieurs rôles spécifiques
 * @param array|string $allowedRoles Rôle(s) autorisé(s) ('admin', 'manager', 'cashier')
 */
function requireRole($allowedRoles) {
    requireLogin();
    
    $userRole = $_SESSION['user_role'] ?? '';
    
    if (is_array($allowedRoles)) {
        if (!in_array($userRole, $allowedRoles)) {
            header('Location: index.php?error=unauthorized');
            exit;
        }
    } else {
        if ($userRole !== $allowedRoles) {
            header('Location: index.php?error=unauthorized');
            exit;
        }
    }
}

/**
 * Récupère les informations de l'utilisateur connecté
 */
function getCurrentUser() {
    if (!isLoggedIn()) return null;
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['user_username'],
        'name' => $_SESSION['user_name'],
        'role' => $_SESSION['user_role']
    ];
}

/**
 * Enregistre une action utilisateur dans le journal d'audit
 */
function logAction($pdo, $userId, $action) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare("INSERT INTO user_logs (user_id, action, ip_address) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $action, $ip]);
    } catch (Exception $e) {
        // Ignorer silencieusement pour éviter de bloquer une transaction si les logs échouent
    }
}

/**
 * Traduit un rôle de la BD en français pour l'affichage
 */
function getRoleLabel($role) {
    switch ($role) {
        case 'super_admin':
            return 'Administrateur SaaS';
        case 'admin':
            return 'Administrateur';
        case 'manager':
            return 'Gestionnaire';
        case 'cashier':
            return 'Caissier';
        case 'rh':
            return 'Ressources Humaines';
        case 'comptable':
            return 'Comptable';
        default:
            return 'Inconnu';
    }
}
?>

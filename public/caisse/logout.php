<?php
/**
 * Déconnexion Sécurisée - KIAM Caisse
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';

if (isLoggedIn()) {
    $userId = $_SESSION['user_id'];
    
    // Logger l'activité
    logAction($pdo, $userId, "Déconnexion de la session utilisateur");
    
    $tenant_slug = $_SESSION['tenant_slug'] ?? '';
    
    // Vider et détruire la session
    $_SESSION = [];
    
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    session_destroy();
}

// Redirection vers l'écran de connexion
if (!empty($tenant_slug)) {
    header('Location: login.php?tenant=' . urlencode($tenant_slug));
} else {
    header('Location: login.php');
}
exit;
?>

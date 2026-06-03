<?php
/**
 * Configuration de la Base de Données - KIAM Caisse (SaaS Multi-Tenant)
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME_MASTER', 'kiam_caisse');

// Déterminer la base de données à charger (Master ou Tenant connecté)
$db_to_connect = DB_NAME_MASTER;
if (isset($_SESSION['tenant_db']) && !empty($_SESSION['tenant_db'])) {
    $db_to_connect = $_SESSION['tenant_db'];
}

try {
    // Connexion PDO pour le contexte actif (soit Master soit le Tenant actuel)
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . $db_to_connect . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Connexion PDO secondaire dédiée à la base de données Master (toujours disponible)
    $pdo_master = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME_MASTER . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // Si la base de données n'existe pas, redirection automatique vers install.php
    $errorCode = $e->getCode();
    if ($errorCode == 1049 && $db_to_connect === DB_NAME_MASTER) {
        if (basename($_SERVER['PHP_SELF']) !== 'install.php') {
            header('Location: install.php');
            exit;
        }
    } else {
        // Autre erreur de connexion (ex: MySQL arrêté)
        die("Erreur critique de connexion au serveur MySQL (" . htmlspecialchars($db_to_connect) . ") : " . $e->getMessage());
    }
}
?>

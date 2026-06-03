<?php
/**
 * Script de migration SaaS Multi-Tenant pour KIAM Caisse
 * 
 * Ce script :
 * 1. Crée la table 'tenants' dans la base de données principale 'kiam_caisse' (Master).
 * 2. Crée la base de données dédiée pour le tenant par défaut 'kiam_caisse_tenant_pilote'.
 * 3. Déplace toutes les tables métiers existantes de 'kiam_caisse' vers 'kiam_caisse_tenant_pilote'.
 * 4. Recrée la table 'users' dans 'kiam_caisse' pour les Super Administrateurs SaaS.
 * 5. Crée le compte Super Administrateur principal (saas_admin / admin).
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME_MASTER', 'kiam_caisse');
define('DEFAULT_TENANT_DB', 'kiam_caisse_tenant_pilote');
define('DEFAULT_TENANT_SLUG', 'pilote');

echo "=== MIGRATION ARCHITECTURE SAAS MULTI-TENANT ===\n\n";

try {
    // 1. Connexion au serveur MySQL
    $pdo = new PDO("mysql:host=" . DB_HOST . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    echo "✓ Connexion au serveur MySQL établie.\n";

    // Vérifier si la base master existe
    $stmt = $pdo->query("SHOW DATABASES LIKE '" . DB_NAME_MASTER . "'");
    if (!$stmt->fetch()) {
        throw new Exception("La base de données principale '" . DB_NAME_MASTER . "' n'existe pas. Veuillez d'abord lancer install.php.");
    }

    // Connecter à la base master
    $pdo->exec("USE `" . DB_NAME_MASTER . "`");
    echo "✓ Base de données Master '" . DB_NAME_MASTER . "' sélectionnée.\n";

    // 2. Création de la table des tenants (locataires) dans la base Master
    echo "\n2. Création de la table 'tenants'...\n";
    $pdo->exec("CREATE TABLE IF NOT EXISTS `tenants` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `slug` VARCHAR(50) NOT NULL UNIQUE,
        `database_name` VARCHAR(100) NOT NULL UNIQUE,
        `logo` VARCHAR(255) NULL,
        `status` ENUM('active', 'suspended') DEFAULT 'active',
        `subscription_plan` ENUM('basic', 'premium', 'business') DEFAULT 'basic',
        `subscription_status` ENUM('active', 'trial', 'expired') DEFAULT 'trial',
        `subscription_expires_at` DATE NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");
    echo "✓ Table 'tenants' créée ou déjà existante.\n";

    // 3. Création de la base de données pour le tenant par défaut
    echo "\n3. Création de la base de données tenant '" . DEFAULT_TENANT_DB . "'...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DEFAULT_TENANT_DB . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Base de données tenant '" . DEFAULT_TENANT_DB . "' créée avec succès.\n";

    // 4. Insérer le tenant pilote s'il n'existe pas
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM tenants WHERE slug = ?");
    $stmtCheck->execute([DEFAULT_TENANT_SLUG]);
    if ($stmtCheck->fetchColumn() == 0) {
        $stmtInsert = $pdo->prepare("INSERT INTO tenants (name, slug, database_name, status, subscription_plan, subscription_status) 
                                     VALUES ('Boutique Pilote', ?, ?, 'active', 'basic', 'active')");
        $stmtInsert->execute([DEFAULT_TENANT_SLUG, DEFAULT_TENANT_DB]);
        echo "✓ Tenant par défaut 'pilote' enregistré dans la base Master.\n";
    } else {
        echo "✓ Tenant par défaut 'pilote' déjà enregistré.\n";
    }

    // 5. Déplacement des tables de kiam_caisse vers kiam_caisse_tenant_pilote
    echo "\n4. Migration des tables métiers vers la base tenant...\n";
    
    // Désactiver les clés étrangères pour renommer librement les tables
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    // Liste des tables métiers à déplacer
    $tablesToMove = [
        'settings',
        'users',
        'categories',
        'products',
        'clients',
        'suppliers',
        'supplier_orders',
        'supplier_order_items',
        'cash_sessions',
        'sales',
        'sale_items',
        'stock_movements',
        'expenses',
        'user_logs',
        'employees',
        'attendance',
        'advances',
        'primes',
        'payslips',
        'payroll_settings',
        'client_payments'
    ];

    foreach ($tablesToMove as $table) {
        // Vérifier si la table existe dans la base master
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->fetch()) {
            // Vérifier si la table existe déjà dans la base de destination
            $stmtDest = $pdo->query("SHOW TABLES FROM `" . DEFAULT_TENANT_DB . "` LIKE '$table'");
            if (!$stmtDest->fetch()) {
                // Déplacer la table
                $pdo->exec("RENAME TABLE `" . DB_NAME_MASTER . "`.`$table` TO `" . DEFAULT_TENANT_DB . "`.`$table`");
                echo "   -> Table '$table' déplacée avec succès.\n";
            } else {
                echo "   ✓ Table '$table' existe déjà dans la base tenant (déplacement sauté).\n";
                // Supprimer de la base master par sécurité
                $pdo->exec("DROP TABLE IF EXISTS `$table`");
            }
        } else {
            echo "   ℹ Table '$table' introuvable dans la base master (déjà déplacée ?).\n";
        }
    }

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "✓ Transfert des tables métiers terminé.\n";

    // 6. Recréation de la table 'users' dans la base Master pour les Super Admins
    echo "\n5. Recréation de la table 'users' dans la base Master...\n";
    $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `username` VARCHAR(50) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `role` ENUM('super_admin') NOT NULL DEFAULT 'super_admin',
        `name` VARCHAR(100) NOT NULL,
        `status` ENUM('active', 'inactive') DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `last_login` TIMESTAMP NULL DEFAULT NULL
    ) ENGINE=InnoDB;");
    echo "✓ Table 'users' créée dans la base Master.\n";

    // 7. Création du compte Super Administrateur dans la base Master
    $stmtCheckSuper = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
    $stmtCheckSuper->execute(['saas_admin']);
    if ($stmtCheckSuper->fetchColumn() == 0) {
        $stmtSuper = $pdo->prepare("INSERT INTO users (username, password_hash, role, name) VALUES (?, ?, 'super_admin', ?)");
        $stmtSuper->execute(['saas_admin', password_hash('admin', PASSWORD_DEFAULT), 'Super Administrateur SaaS']);
        echo "✓ Compte Super Administrateur créé avec succès.\n";
        echo "   -> Identifiant : saas_admin\n";
        echo "   -> Mot de passe : admin\n";
    } else {
        echo "✓ Compte Super Administrateur déjà existant.\n";
    }

    echo "\n=== TOUTES LES ÉTAPES DE MIGRATION SAAS ONT RÉUSSI AVEC SUCCÈS ! ===\n";

} catch (Exception $e) {
    echo "\n✗ ERREUR CRITIQUE DURANT LA MIGRATION : " . $e->getMessage() . "\n";
    exit(1);
}
?>

<?php
/**
 * Script de Migration et de Nettoyage pour la Production - KIAM Caisse
 */

require_once __DIR__ . '/config/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "=== MIGRATION & NETTOYAGE POUR PRODUCTION ===\n\n";

try {
    // 1. Correction de la table 'expenses' (Ajout de user_id si manquant)
    echo "1. Vérification de la table 'expenses'...\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM expenses LIKE 'user_id'");
    $columnExists = $stmt->fetch();

    if (!$columnExists) {
        echo "   -> La colonne 'user_id' est manquante. Ajout en cours...\n";
        
        // Désactiver les clés étrangères le temps de la modification
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        
        // Ajouter la colonne
        $pdo->exec("ALTER TABLE expenses ADD COLUMN user_id INT NULL AFTER id");
        echo "   -> Colonne 'user_id' ajoutée.\n";
        
        // Ajouter la clé étrangère
        $pdo->exec("ALTER TABLE expenses ADD CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL");
        echo "   -> Clé étrangère configurée.\n";
        
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    } else {
        echo "   ✓ La colonne 'user_id' est déjà présente.\n";
    }

    // 2. Nettoyage des données fictives pour la production
    echo "\n2. Nettoyage des données de démonstration...\n";
    
    // Désactiver les vérifications des clés étrangères pour pouvoir vider les tables
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    $tablesToTruncate = [
        'sale_items',
        'sales',
        'cash_sessions',
        'stock_movements',
        'expenses',
        'client_payments',
        'payslips',
        'primes',
        'advances',
        'attendance',
        'employees',
        'products',
        'categories',
        'suppliers',
        'user_logs'
    ];

    foreach ($tablesToTruncate as $table) {
        $pdo->exec("TRUNCATE TABLE `$table`");
        echo "   ✓ Table '$table' vidée.\n";
    }

    // Nettoyer les clients sauf le client générique (ID = 1)
    $pdo->exec("DELETE FROM clients WHERE id > 1");
    // Vérifier si le client de passage existe, sinon le créer
    $checkClient = $pdo->query("SELECT COUNT(*) FROM clients WHERE id = 1")->fetchColumn();
    if ($checkClient == 0) {
        $pdo->exec("INSERT INTO clients (id, name, phone, email, address, loyalty_points, balance) 
                    VALUES (1, 'Client de Passage', NULL, NULL, NULL, 0, 0.00)");
        echo "   ✓ Client de passage (ID 1) créé.\n";
    } else {
        $pdo->exec("UPDATE clients SET loyalty_points = 0, balance = 0.00 WHERE id = 1");
        echo "   ✓ Client de passage (ID 1) réinitialisé.\n";
    }
    
    // Nettoyer les utilisateurs sauf l'admin
    $pdo->exec("DELETE FROM users WHERE username != 'admin'");
    echo "   ✓ Utilisateurs de test supprimés (admin conservé).\n";

    // Réinitialiser les paramètres
    $pdo->exec("TRUNCATE TABLE settings");
    $pdo->exec("INSERT INTO settings (company_name, company_phone, company_email, company_address, currency, tax_rate) 
                VALUES ('Votre Boutique', '', '', '', 'FCFA', 18.00)");
    echo "   ✓ Paramètres d'entreprise réinitialisés.\n";

    // Réactiver les clés étrangères
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    echo "\n=== MIGRATION ET NETTOYAGE EFFECTUÉS AVEC SUCCÈS ! ===\n";
    echo "Vous pouvez maintenant supprimer ce fichier 'migrate.php' par sécurité.\n";

} catch (Exception $e) {
    echo "\n✗ ERREUR CRITIQUE : " . $e->getMessage() . "\n";
}
?>

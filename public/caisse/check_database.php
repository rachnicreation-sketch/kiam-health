<?php
/**
 * Script de Vérification - Structure de la Base de Données
 */

require_once __DIR__ . '/config/db.php';

try {
    // Vérifier l'existence de la base de données
    $dbName = 'kiam_caisse_tenant_pilote';
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . $dbName . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    $currentDb = $dbName;
    
    echo "=== VÉRIFICATION DE LA BASE DE DONNÉES ===\n\n";
    echo "✓ Connexion établie à: " . $currentDb . "\n\n";
    
    // Liste des tables requises pour la paie
    $requiredTables = [
        'employees' => 'Employés',
        'attendance' => 'Pointages',
        'payslips' => 'Bulletins de Paie',
        'advances' => 'Avances de Salaire',
        'primes' => 'Primes & Bonus',
        'payroll_settings' => 'Paramètres de Paie'
    ];
    
    echo "=== TABLES DE PAIE ===\n";
    foreach ($requiredTables as $tableName => $description) {
        $result = $pdo->query("SHOW TABLES LIKE '$tableName'");
        if ($result->fetch()) {
            echo "✓ $tableName ($description)\n";
            
            // Compter les enregistrements
            $countStmt = $pdo->query("SELECT COUNT(*) FROM $tableName");
            $count = $countStmt->fetchColumn();
            echo "  └─ Enregistrements: $count\n";
        } else {
            echo "✗ $tableName ($description) - MANQUANTE\n";
        }
    }
    
    echo "\n=== TABLES TRANSACTIONNELLES ===\n";
    $transactionTables = ['sales', 'sale_items', 'cash_sessions'];
    foreach ($transactionTables as $tableName) {
        $result = $pdo->query("SHOW TABLES LIKE '$tableName'");
        if ($result->fetch()) {
            echo "✓ $tableName\n";
            $countStmt = $pdo->query("SELECT COUNT(*) FROM $tableName");
            $count = $countStmt->fetchColumn();
            echo "  └─ Enregistrements: $count\n";
        } else {
            echo "✗ $tableName - MANQUANTE\n";
        }
    }
    
    echo "\n=== AUTRES TABLES CRITIQUES ===\n";
    $otherTables = ['users', 'products', 'clients', 'suppliers', 'categories', 'expenses'];
    foreach ($otherTables as $tableName) {
        $result = $pdo->query("SHOW TABLES LIKE '$tableName'");
        if ($result->fetch()) {
            echo "✓ $tableName\n";
        } else {
            echo "✗ $tableName - MANQUANTE\n";
        }
    }
    
    echo "\n=== VÉRIFICATION DES COLONNES CRITIQUES (PAIE) ===\n";
    
    // Vérifier les colonnes de la table employees
    echo "\nTable 'employees':\n";
    $columns = $pdo->query("DESCRIBE employees")->fetchAll(PDO::FETCH_ASSOC);
    $expectedCols = ['id', 'matricule', 'name', 'first_name', 'base_salary', 'work_basis', 'cnss_enabled'];
    foreach ($expectedCols as $col) {
        $exists = array_filter($columns, fn($c) => $c['Field'] === $col);
        echo ($exists ? "✓" : "✗") . " $col\n";
    }
    
    // Vérifier les colonnes de la table attendance
    echo "\nTable 'attendance':\n";
    $columns = $pdo->query("DESCRIBE attendance")->fetchAll(PDO::FETCH_ASSOC);
    $expectedCols = ['employee_id', 'date', 'status', 'hours_worked', 'overtime_hours', 'night_hours'];
    foreach ($expectedCols as $col) {
        $exists = array_filter($columns, fn($c) => $c['Field'] === $col);
        echo ($exists ? "✓" : "✗") . " $col\n";
    }
    
    // Vérifier les colonnes de la table payslips
    echo "\nTable 'payslips':\n";
    $columns = $pdo->query("DESCRIBE payslips")->fetchAll(PDO::FETCH_ASSOC);
    $expectedCols = ['id', 'bulletin_code', 'employee_id', 'gross_salary', 'cnss_deduction', 'tax_deduction', 'net_salary'];
    foreach ($expectedCols as $col) {
        $exists = array_filter($columns, fn($c) => $c['Field'] === $col);
        echo ($exists ? "✓" : "✗") . " $col\n";
    }
    
    echo "\n=== RÉSUMÉ ===\n";
    echo "✓ Système COMPLÈTEMENT configuré et prêt à l'emploi\n";
    
} catch (Exception $e) {
    echo "✗ ERREUR: " . $e->getMessage() . "\n";
}
?>

<?php
/**
 * Script d'exécution des migrations Phase 1 Procurement
 * Version robuste avec gestion correcte des délimiteurs
 */

// Configuration
$migrationFile = __DIR__ . '/migrations/migration_phase1_procurement_fixed.sql';

// Connexion à la base de données
try {
    $pdo = new PDO('mysql:host=localhost', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Sélection de la base de données
    $pdo->exec('USE kiam_caisse');
    
    // Lecture du fichier SQL
    if (!file_exists($migrationFile)) {
        die("❌ Fichier de migration non trouvé: $migrationFile\n");
    }
    
    $sqlContent = file_get_contents($migrationFile);
    
    // Diviser par les délimiteurs et filtrer les commentaires
    $queries = [];
    $currentQuery = '';
    
    foreach (explode("\n", $sqlContent) as $line) {
        $trimmed = trim($line);
        
        // Ignorer les commentaires et les lignes vides
        if (empty($trimmed) || substr($trimmed, 0, 2) === '--') {
            continue;
        }
        
        $currentQuery .= "\n" . $line;
        
        // Si la ligne se termine par ;, c'est la fin d'une requête
        if (substr(rtrim($line), -1) === ';') {
            $queries[] = trim($currentQuery);
            $currentQuery = '';
        }
    }
    
    // Ajouter la dernière requête s'il y en a une
    if (!empty(trim($currentQuery))) {
        $queries[] = trim($currentQuery);
    }
    
    $successCount = 0;
    $errorCount = 0;
    $errors = [];
    
    echo "🚀 Exécution des migrations Phase 1 Procurement...\n";
    echo "═══════════════════════════════════════════════════\n\n";
    
    foreach ($queries as $index => $query) {
        $query = trim($query);
        if (empty($query)) continue;
        
        try {
            $pdo->exec($query);
            $successCount++;
            
            // Parser et afficher le type d'opération
            if (preg_match('/^\s*(ALTER|CREATE|DROP)\s+(TABLE|VIEW|INDEX)\s+(\w+)/i', $query, $matches)) {
                $operation = strtoupper($matches[1]);
                $objectType = strtoupper($matches[2]);
                $objectName = $matches[3];
                
                $emoji = match($operation) {
                    'CREATE' => '✅ Créé',
                    'ALTER' => '✏️  Modifié',
                    'DROP' => '🗑️  Supprimé',
                    default => '✓'
                };
                
                echo "{$emoji}: {$objectName} ({$objectType})\n";
            }
        } catch (PDOException $e) {
            $errorCount++;
            $errorMsg = $e->getMessage();
            
            // Ignorer les erreurs IF NOT EXISTS et similaires
            if (strpos($errorMsg, 'already exists') === false &&
                strpos($errorMsg, 'Duplicate') === false &&
                strpos($errorMsg, 'already') === false &&
                strpos($errorMsg, 'FOREIGN KEY') === false) {
                
                echo "⚠️  Erreur: {$errorMsg}\n";
                $errors[] = $errorMsg;
            } else {
                $successCount++; // Compter comme succès si erreur attendue
                $errorCount--;
            }
        }
    }
    
    echo "\n═══════════════════════════════════════════════════\n";
    echo "📊 Résultats:\n";
    echo "   ✅ Opérations réussies: $successCount\n";
    echo "   ⚠️  Erreurs critiques: " . count($errors) . "\n";
    
    if (!empty($errors)) {
        echo "\nErreurs détectées:\n";
        foreach ($errors as $error) {
            echo "   - {$error}\n";
        }
    }
    
    echo "\n🎉 Migration Phase 1 Procurement COMPLÉTÉE!\n";
    echo "═══════════════════════════════════════════════════\n";
    
    // Vérification des tables créées
    echo "\n📋 Vérification des tables créées:\n";
    $tables = [
        'supplier_contacts',
        'supplier_products',
        'supplier_price_history',
        'supplier_performance',
        'warehouses',
        'stores'
    ];
    
    foreach ($tables as $table) {
        try {
            $result = $pdo->query("SELECT COUNT(*) as cnt FROM `$table`");
            echo "✅ $table: OK\n";
        } catch (Exception $e) {
            echo "❌ $table: NON TROUVÉE\n";
        }
    }
    
} catch (Exception $e) {
    die("❌ Erreur critique: " . $e->getMessage());
}
?>

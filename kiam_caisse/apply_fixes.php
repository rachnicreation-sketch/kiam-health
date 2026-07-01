<?php
/**
 * Script pour exécuter les corrections Phase 1 Procurement
 */

$fixesFile = __DIR__ . '/migrations/migration_phase1_fixes.sql';

try {
    $pdo = new PDO('mysql:host=localhost', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('USE kiam_caisse');
    
    if (!file_exists($fixesFile)) {
        die("❌ Fichier de corrections non trouvé\n");
    }
    
    $sqlContent = file_get_contents($fixesFile);
    
    // Diviser par requête
    $queries = [];
    $currentQuery = '';
    
    foreach (explode("\n", $sqlContent) as $line) {
        $trimmed = trim($line);
        if (empty($trimmed) || substr($trimmed, 0, 2) === '--') {
            continue;
        }
        
        $currentQuery .= "\n" . $line;
        
        if (substr(rtrim($line), -1) === ';') {
            $queries[] = trim($currentQuery);
            $currentQuery = '';
        }
    }
    
    echo "🔧 Exécution des corrections Phase 1...\n";
    echo "═════════════════════════════════════\n\n";
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($queries as $query) {
        $query = trim($query);
        if (empty($query) || strlen($query) < 10) continue;
        
        try {
            if (preg_match('/^SHOW|^SELECT|^CALL|^CREATE PROCEDURE/i', $query)) {
                $result = $pdo->query($query);
                if ($result) {
                    $rows = $result->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($rows as $row) {
                        echo "  ✅ " . json_encode($row) . "\n";
                    }
                }
            } else {
                $pdo->exec($query);
            }
            $successCount++;
            
            if (preg_match('/CREATE INDEX|CREATE PROCEDURE|ALTER TABLE/i', $query)) {
                preg_match('/(?:INDEX|PROCEDURE|TABLE)\s+(\w+)/i', $query, $m);
                echo "✅ " . ($m[1] ?? 'Opération') . "\n";
            }
        } catch (PDOException $e) {
            $errorCount++;
            // Ignorer les erreurs bénignes
            if (strpos($e->getMessage(), 'already exists') === false &&
                strpos($e->getMessage(), 'already has') === false &&
                strpos($e->getMessage(), 'Duplicate') === false) {
                echo "⚠️  " . substr($e->getMessage(), 0, 80) . "\n";
            }
        }
    }
    
    echo "\n═════════════════════════════════════\n";
    echo "✅ Corrections appliquées: $successCount\n";
    
} catch (Exception $e) {
    die("❌ Erreur: " . $e->getMessage());
}
?>

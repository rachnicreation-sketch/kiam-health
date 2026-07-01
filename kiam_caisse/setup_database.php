<?php
/**
 * Script pour exécuter le database.sql complet
 */

$databaseSqlFile = __DIR__ . '/database.sql';

try {
    $pdo = new PDO('mysql:host=localhost', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if (!file_exists($databaseSqlFile)) {
        die("❌ Fichier database.sql non trouvé\n");
    }
    
    $sqlContent = file_get_contents($databaseSqlFile);
    
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
    
    if (!empty(trim($currentQuery))) {
        $queries[] = trim($currentQuery);
    }
    
    echo "🚀 Exécution du database.sql complet...\n";
    echo "═════════════════════════════════════\n\n";
    
    $successCount = 0;
    foreach ($queries as $query) {
        $query = trim($query);
        if (empty($query)) continue;
        
        try {
            $pdo->exec($query);
            $successCount++;
            if (preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $query, $m)) {
                echo "✅ Table: {$m[1]}\n";
            }
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'already exists') === false) {
                echo "⚠️  {$e->getMessage()}\n";
            }
        }
    }
    
    echo "\n═════════════════════════════════════\n";
    echo "✅ database.sql exécuté: $successCount requêtes\n";
    
    // Vérification
    $result = $pdo->query("SHOW TABLES FROM kiam_caisse");
    $tables = $result->fetchAll(PDO::FETCH_COLUMN);
    echo "\n📊 Tables présentes: " . count($tables) . "\n";
    
} catch (Exception $e) {
    die("❌ Erreur: " . $e->getMessage());
}
?>

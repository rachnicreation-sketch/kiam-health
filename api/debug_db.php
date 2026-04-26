<?php
require_once 'config.php';

try {
    echo "=== DATABASE DEBUG ===\n";
    $pdo->query("SELECT 1");
    echo "Connection OK\n";

    // Check tables
    $tables = ['kiam_tenants', 'kiam_global_users', 'kiam_plans'];
    foreach ($tables as $t) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$t]);
        if ($stmt->fetch()) {
            echo "Table $t exists\n";
            // Check columns
            $cols = $pdo->query("DESCRIBE $t")->fetchAll(PDO::FETCH_COLUMN);
            echo "Columns: " . implode(', ', $cols) . "\n";
        } else {
            echo "Table $t DOES NOT EXIST\n";
        }
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>

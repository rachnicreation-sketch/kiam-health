<?php
require_once 'api/config.php';
try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (empty($tables)) {
        echo "No tables found in the database.";
    } else {
        echo implode("\n", $tables);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>

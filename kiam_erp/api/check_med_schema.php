<?php
require_once 'config.php';
foreach (['medications', 'medication_batches'] as $tbl) {
    echo "--- $tbl ---\n";
    $stmt = $pdo->query("DESCRIBE $tbl");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
}
?>

<?php
require_once 'api/config.php';
$tables = ['invoices', 'invoice_items', 'transactions'];
foreach ($tables as $table) {
    echo "--- Table: $table ---\n";
    $stmt = $pdo->query("DESCRIBE $table");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
}
?>

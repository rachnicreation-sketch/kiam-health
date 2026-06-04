<?php
require_once 'config.php';
foreach (['employees', 'payrolls', 'payroll_items', 'user_docs'] as $tbl) {
    echo "--- $tbl ---\n";
    $stmt = $pdo->query("DESCRIBE $tbl");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
}
?>

<?php
require_once 'api/config.php';

$tables = ['kiam_plans', 'kiam_tenants', 'kiam_global_users', 'kiam_tenant_modules'];
$schema = [];

foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        $schema[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $schema[$table] = "Error: " . $e->getMessage();
    }
}

echo json_encode($schema, JSON_PRETTY_PRINT);
?>

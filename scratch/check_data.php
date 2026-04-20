<?php
require_once 'api/config.php';

$tables = ['kiam_plans', 'kiam_tenants', 'kiam_global_users'];
$data = [];

foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SELECT * FROM $table");
        $data[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $data[$table] = "Error: " . $e->getMessage();
    }
}

echo json_encode($data, JSON_PRETTY_PRINT);
?>

<?php
// Script to check tenants
require_once __DIR__ . '/../api/config.php';
$stmt = $pdo->query("SELECT id, name, subscription_status FROM kiam_tenants");
$tenants = $stmt->fetchAll(PDO::FETCH_ASSOC);
header('Content-Type: application/json');
echo json_encode($tenants, JSON_PRETTY_PRINT);
?>

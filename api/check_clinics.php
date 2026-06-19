<?php
require_once 'config.php';
echo "--- clinics ---\n";
$stmt = $pdo->query("SELECT id, name FROM clinics");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "--- kiam_tenants ---\n";
$stmt = $pdo->query("SELECT id, name FROM kiam_tenants");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>

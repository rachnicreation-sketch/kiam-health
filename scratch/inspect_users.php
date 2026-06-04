<?php
require_once __DIR__ . '/../api/config.php';

echo "=== GLOBAL USERS ===\n";
$gu = $pdo->query("SELECT gu.id, gu.email, gu.tenant_id, t.name as tenant_name, t.sector FROM kiam_global_users gu LEFT JOIN kiam_tenants t ON gu.tenant_id = t.id")->fetchAll();
print_r($gu);

echo "\n=== LOCAL USERS ===\n";
$lu = $pdo->query("SELECT u.id, u.email, u.clinic_id, c.name as clinic_name, u.role FROM users u LEFT JOIN clinics c ON u.clinic_id = c.id")->fetchAll();
print_r($lu);
?>

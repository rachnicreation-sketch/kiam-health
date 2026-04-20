<?php
require_once 'api/config.php';

$tables = [
    'kiam_tenants',
    'kiam_global_users',
    'kiam_tenant_modules',
    'kiam_support_tickets',
    'kiam_system_announcements',
    'kiam_plans',
    'users',
    'clinics'
];

echo "Checking tables...\n";
foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        echo "[OK] $table\n";
    } catch (Exception $e) {
        echo "[MISSING] $table - " . $e->getMessage() . "\n";
    }
}
?>

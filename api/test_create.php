<?php
require_once 'config.php';
require_once 'functions.php';

try {
    echo "=== TEST CREATE TENANT ===\n";
    $tenantId = generateId('tnt_test_');
    $name = "Test Tenant " . time();
    $sector = "health";
    $plan_id = "basic";

    $stmt = $pdo->prepare("INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status) VALUES (?, ?, ?, ?, 'active')");
    $stmt->execute([$tenantId, $name, $sector, $plan_id]);
    echo "Tenant created: $tenantId\n";

    $email = "test_" . time() . "@test.com";
    $password = "password";
    $userId = generateId('usr_test_');
    $stmt = $pdo->prepare("INSERT INTO kiam_global_users (id, email, password_hash, tenant_id, global_role) VALUES (?, ?, ?, ?, 'tenant_admin')");
    $stmt->execute([$userId, $email, password_hash($password, PASSWORD_DEFAULT), $tenantId]);
    echo "User created: $userId\n";

    echo "SUCCESS";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    // Check if table exists
    $stmt = $pdo->query("SHOW TABLES");
    echo "Tables in DB: " . implode(', ', $stmt->fetchAll(PDO::FETCH_COLUMN)) . "\n";
}
?>

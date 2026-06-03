<?php
require_once 'api/config.php';

echo "--- TENANTS ---\n";
$stmt = $pdo->query("SELECT * FROM kiam_tenants");
$tenants = $stmt->fetchAll();
print_r($tenants);

echo "\n--- GLOBAL USERS ---\n";
$stmt = $pdo->query("SELECT * FROM kiam_global_users");
$users = $stmt->fetchAll();
print_r($users);

if (count($users) == 0 && count($tenants) > 0) {
    echo "\nCreating admin user...\n";
    $tenantId = $tenants[0]['id'];
    $adminId = 'admin_' . uniqid();
    $email = 'admin@kiam.tech';
    $password = 'Admin2024!';
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES (?, ?, ?, ?, 'saas_admin')");
    $stmt->execute([$adminId, $tenantId, $email, $hashedPassword]);
    
    echo "Admin created: $email / $password\n";
} elseif (count($tenants) == 0) {
    echo "\nNo tenants found. Creating a system tenant...\n";
    $tenantId = 'system_tenant';
    $stmt = $pdo->prepare("INSERT INTO kiam_tenants (id, name, sector, subscription_status) VALUES (?, 'System Admin', 'erp', 'active')");
    $stmt->execute([$tenantId, 'System Admin']);
    
    $adminId = 'admin_system';
    $email = 'admin@kiam.tech';
    $password = 'Admin2024!';
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES (?, ?, ?, ?, 'saas_admin')");
    $stmt->execute([$adminId, $tenantId, $email, $hashedPassword]);
    
    echo "System tenant and Admin created: $email / $password\n";
}
?>

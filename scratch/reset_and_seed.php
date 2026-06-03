<?php
require_once 'api/config.php';
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Add max_branches if not exists
    $pdo->exec("ALTER TABLE kiam_plans ADD COLUMN max_branches INT DEFAULT 0 AFTER max_storage_gb");
} catch (Exception $e) {
    // Already exists
}

$pdo->exec("UPDATE kiam_plans SET max_branches = 0 WHERE id = 'plan_basic'");
$pdo->exec("UPDATE kiam_plans SET max_branches = 3 WHERE id = 'plan_pro'");
$pdo->exec("UPDATE kiam_plans SET max_branches = 999 WHERE id = 'plan_ent'");

echo "Plans updated successfully\n";

// Clear existing tenants and users
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
$pdo->exec("TRUNCATE TABLE kiam_tenants");
$pdo->exec("TRUNCATE TABLE kiam_global_users");
$pdo->exec("TRUNCATE TABLE kiam_tenant_modules");
$pdo->exec("TRUNCATE TABLE branches");
$pdo->exec("TRUNCATE TABLE users");
$pdo->exec("TRUNCATE TABLE patients");
$pdo->exec("TRUNCATE TABLE appointments");
$pdo->exec("TRUNCATE TABLE invoices");
$pdo->exec("TRUNCATE TABLE medications");
$pdo->exec("TRUNCATE TABLE kiam_audit_logs");
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "All existing data cleared\n";

$sectors = [
    'health' => [
        ['name' => 'Clinique la vie', 'email' => 'admin@cliniquelavie.com'],
        ['name' => 'Clinique la Fraternité', 'email' => 'admin@cliniquefraternite.com'],
        ['name' => 'Clinique Marion', 'email' => 'admin@marion.com']
    ],
    'school' => [
        ['name' => 'Komput', 'email' => 'admin@komput.com'],
        ['name' => 'Yekol’Hub', 'email' => 'admin@yekolhub.com'],
        ['name' => 'ESTAM', 'email' => 'admin@estam.com']
    ],
    'enterprise' => [
        ['name' => 'RX services', 'email' => 'admin@rxservices.com'],
        ['name' => 'Matiaba firm', 'email' => 'admin@matiabafirm.com'],
        ['name' => 'Nzad’yeto', 'email' => 'admin@nzadyeto.com']
    ],
    'pharmacy' => [
        ['name' => 'La vie', 'email' => 'admin@lavie.com'],
        ['name' => 'Medina', 'email' => 'admin@medina.com'],
        ['name' => 'Fraternité', 'email' => 'admin@fraternite.com']
    ],
    'hotel' => [
        ['name' => 'Hôtel la plage', 'email' => 'admin@laplage.com'],
        ['name' => 'Hôtel Matiaba', 'email' => 'admin@matiaba.com'],
        ['name' => 'Hôtel la gare', 'email' => 'admin@lagare.com']
    ],
    'erp' => [
        ['name' => 'Yoko shop', 'email' => 'admin@yokoshop.com'],
        ['name' => 'Market', 'email' => 'admin@market.com'],
        ['name' => 'Zando', 'email' => 'admin@zando.com']
    ]
];

$plans = ['plan_basic', 'plan_pro', 'plan_ent'];
$passwordHash = password_hash('admin123', PASSWORD_DEFAULT);

foreach ($sectors as $sector => $tenants) {
    foreach ($tenants as $index => $t) {
        $planId = $plans[$index];
        $tenantId = 't_' . $sector . '_' . ($index + 1);
        $name = $t['name'];
        $email = $t['email'];

        // Create Tenant
        $stmt = $pdo->prepare("INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status, created_at) VALUES (?, ?, ?, ?, 'active', NOW())");
        $stmt->execute([$tenantId, $name, $sector, $planId]);

        // Create Global Admin User
        $userId = 'u_' . $tenantId . '_admin';
        $stmt = $pdo->prepare("INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES (?, ?, ?, ?, 'tenant_admin')");
        $stmt->execute([$userId, $tenantId, $email, $passwordHash]);

        // Add default modules
        $default_modules = [
            'health' => ['health', 'pharmacy'],
            'hotel' => ['hotel', 'billing'],
            'school' => ['school'],
            'enterprise' => ['enterprise'],
            'pharmacy' => ['pharmacy'],
            'erp' => ['erp']
        ];
        
        foreach ($default_modules[$sector] as $mod) {
            $stmt = $pdo->prepare("INSERT INTO kiam_tenant_modules (tenant_id, module_name, is_active) VALUES (?, ?, 1)");
            $stmt->execute([$tenantId, $mod]);
        }

        echo "Created Tenant: $name ($planId) / $email\n";
    }
}

// Restore master admin
$tenantId = 'system_tenant';
$pdo->prepare("INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status, created_at) VALUES (?, 'System Administration', 'enterprise', 'plan_ent', 'active', NOW())")
    ->execute([$tenantId]);

$masterId = 'admin_master';
$masterEmail = 'master@kiam.tech';
$masterPass = password_hash('kiam2026', PASSWORD_DEFAULT);
$pdo->prepare("INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES (?, ?, ?, ?, 'saas_admin')")
    ->execute([$masterId, $tenantId, $masterEmail, $masterPass]);

echo "\nMaster admin restored: $masterEmail / kiam2026\n";
?>

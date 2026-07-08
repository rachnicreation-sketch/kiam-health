<?php
require_once __DIR__ . '/api/config.php';

$rootEmail = 'admin@kiam.local';
$rootPassword = 'KiamAdmin@2026!';
$saasEmail = 'saas.admin@kiam.local';
$saasPassword = 'KiamSaas@2026!';
$tenantPassword = 'KiamTenant@2026!';

$pdo->exec('CREATE TABLE IF NOT EXISTS kiam_tenants (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, sector VARCHAR(50) NOT NULL DEFAULT "health", plan_id VARCHAR(50), subscription_status VARCHAR(50) DEFAULT "trial")');
$pdo->exec('CREATE TABLE IF NOT EXISTS kiam_global_users (id VARCHAR(50) PRIMARY KEY, tenant_id VARCHAR(50) NOT NULL, email VARCHAR(100) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, global_role ENUM("saas_admin","tenant_admin","tenant_user") DEFAULT "tenant_user", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');

$tenantRows = $pdo->query('SELECT id, name FROM kiam_tenants ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
if (empty($tenantRows)) {
    $tenantId = 'demo';
    $tenantName = 'Demo Tenant';
    $pdo->prepare('INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status) VALUES (?, ?, ?, ?, ?)')->execute([$tenantId, $tenantName, 'health', null, 'active']);
    $tenantRows = [['id' => $tenantId, 'name' => $tenantName]];
    echo "Created default tenant: $tenantName ($tenantId)\n";
}

$tenantId = $tenantRows[0]['id'];
$rootHash = password_hash($rootPassword, PASSWORD_DEFAULT);
$saasHash = password_hash($saasPassword, PASSWORD_DEFAULT);
$tenantHash = password_hash($tenantPassword, PASSWORD_DEFAULT);

$pdo->prepare('INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE tenant_id = VALUES(tenant_id), password_hash = VALUES(password_hash), global_role = VALUES(global_role)')->execute([
    'u_root_' . time(),
    $tenantId,
    $rootEmail,
    $rootHash,
    'saas_admin'
]);

$saasCheck = $pdo->prepare('SELECT id FROM kiam_global_users WHERE email = ? LIMIT 1');
$saasCheck->execute([$saasEmail]);
$saasUser = $saasCheck->fetch(PDO::FETCH_ASSOC);
if ($saasUser) {
    $pdo->prepare('UPDATE kiam_global_users SET tenant_id = ?, password_hash = ?, global_role = ? WHERE id = ?')->execute([$tenantId, $saasHash, 'saas_admin', $saasUser['id']]);
    echo "Updated SaaS admin: $saasEmail / $saasPassword\n";
} else {
    $saasId = 'u_saas_' . time();
    $pdo->prepare('INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES (?, ?, ?, ?, ?)')->execute([$saasId, $tenantId, $saasEmail, $saasHash, 'saas_admin']);
    echo "Created SaaS admin: $saasEmail / $saasPassword\n";
}

foreach ($tenantRows as $tenant) {
    $tenantId = $tenant['id'];
    $tenantEmail = 'tenant.' . strtolower(preg_replace('/[^a-z0-9]+/', '.', $tenantId)) . '@kiam.local';
    $tenantCheck = $pdo->prepare('SELECT id FROM kiam_global_users WHERE email = ? AND tenant_id = ? LIMIT 1');
    $tenantCheck->execute([$tenantEmail, $tenantId]);
    $tenantUser = $tenantCheck->fetch(PDO::FETCH_ASSOC);

    if ($tenantUser) {
        $pdo->prepare('UPDATE kiam_global_users SET password_hash = ?, global_role = ? WHERE id = ?')->execute([$tenantHash, 'tenant_admin', $tenantUser['id']]);
        echo "Updated tenant admin: $tenantEmail / $tenantPassword ($tenantId)\n";
    } else {
        $tenantUserId = 'u_tenant_' . time() . '_' . substr(md5($tenantId), 0, 6);
        $pdo->prepare('INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES (?, ?, ?, ?, ?)')->execute([$tenantUserId, $tenantId, $tenantEmail, $tenantHash, 'tenant_admin']);
        echo "Created tenant admin: $tenantEmail / $tenantPassword ($tenantId)\n";
    }
}

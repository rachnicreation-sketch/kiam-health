<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$name = trim($input['name'] ?? '');
$sector = trim($input['sector'] ?? '');
$plan_id = trim($input['plan_id'] ?? '');
$admin_name = trim($input['admin_name'] ?? '');
$admin_email = trim($input['admin_email'] ?? '');
$admin_password = trim($input['admin_password'] ?? '');

if (empty($name) || empty($sector) || empty($plan_id) || empty($admin_name) || empty($admin_email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Name, sector, plan_id, admin_name, and admin_email are required']);
    exit;
}

// Validate sector
$valid_sectors = ['health', 'hotel', 'school', 'erp', 'shop', 'enterprise'];
if (!in_array($sector, $valid_sectors)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid sector']);
    exit;
}

// Validate plan_id
$valid_plans = ['plan_basic', 'plan_pro', 'plan_ent'];
if (!in_array($plan_id, $valid_plans)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid plan_id']);
    exit;
}

try {
    // Generate tenant ID
    $tenant_id = 't_' . $sector . '_' . time() . '_' . rand(100, 999);

    // Calculate MRR based on plan
    $mrr_values = [
        'plan_basic' => 25000,
        'plan_pro' => 75000,
        'plan_ent' => 250000
    ];
    $mrr_value = $mrr_values[$plan_id];

    // Start transaction
    $pdo->beginTransaction();

    // Insert tenant
    $stmt = $pdo->prepare("
        INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status, mrr_value, created_at)
        VALUES (?, ?, ?, ?, 'active', ?, NOW())
    ");
    $stmt->execute([$tenant_id, $name, $sector, $plan_id, $mrr_value]);

    // Generate admin user ID and normalize provided admin data
    $user_id = 'u_' . $sector . '_admin_' . time();
    $email = filter_var($admin_email, FILTER_VALIDATE_EMAIL) ? $admin_email : 'admin@' . strtolower(str_replace(' ', '', $name)) . '.local';
    $password = !empty($admin_password) ? $admin_password : 'kiam2026';
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Insert global user as tenant admin for the new tenant
    $stmt = $pdo->prepare("
        INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role)
        VALUES (?, ?, ?, ?, 'tenant_admin')
    ");
    $stmt->execute([$user_id, $tenant_id, $email, $password_hash]);

    // Activate default modules based on sector
    $default_modules = [
        'health' => ['health', 'pharmacy'],
        'hotel' => ['hotel', 'billing'],
        'school' => ['school'],
        'erp' => ['erp'],
        'shop' => ['pharmacy'],
        'enterprise' => ['enterprise']
    ];

    $modules = $default_modules[$sector] ?? [];
    foreach ($modules as $module) {
        $stmt = $pdo->prepare("
            INSERT INTO kiam_tenant_modules (tenant_id, module_name, is_active, activated_at)
            VALUES (?, ?, 1, NOW())
        ");
        $stmt->execute([$tenant_id, $module]);
    }

    // Commit transaction
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'tenant' => [
            'id' => $tenant_id,
            'name' => $name,
            'sector' => $sector,
            'plan_id' => $plan_id,
            'mrr_value' => $mrr_value,
            'admin_email' => $email,
            'admin_name' => $admin_name,
            'generated_password' => empty($admin_password) ? $password : null
        ],
        'message' => 'Tenant created successfully'
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
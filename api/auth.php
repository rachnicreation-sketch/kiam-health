<?php
require_once 'config.php';
require_once 'functions.php';
require_once 'jwt.php';

$data = getRequestData();
$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (!$email || !$password) {
        sendResponse(["status" => "error", "message" => "Email et mot de passe requis"], 400);
    }

    // 1. Check Global SaaS Users (Master Admins & Tenant Owners)
    $stmt = $pdo->prepare("
        SELECT gu.*, t.name as tenant_name, t.sector 
        FROM kiam_global_users gu 
        LEFT JOIN kiam_tenants t ON gu.tenant_id = t.id 
        WHERE gu.email = ?
    ");
    $stmt->execute([$email]);
    $globalUser = $stmt->fetch();

    if ($globalUser && ($password === $globalUser['password_hash'] || password_verify($password, $globalUser['password_hash']))) {
        ensureClinicForTenant($pdo, $globalUser['tenant_id']);

        // Issue JWT token
        $token = JWT::encode([
            'id' => $globalUser['id'],
            'email' => $globalUser['email'],
            'tenant_id' => $globalUser['tenant_id'],
            'role' => $globalUser['global_role']
        ]);

        sendResponse([
            "status" => "success",
            "token" => $token,
            "user" => [
                "id" => $globalUser['id'],
                "email" => $globalUser['email'],
                "role" => $globalUser['global_role'] === 'saas_admin' ? 'saas_admin' : 'clinic_admin',
                "global_role" => $globalUser['global_role'],
                "clinicId" => $globalUser['tenant_id'],
                "sector" => $globalUser['sector'] ?: 'health',
                "name" => $globalUser['tenant_name'] ?: 'Super Admin'
            ],
            "clinic" => [
                "id" => $globalUser['tenant_id'],
                "name" => $globalUser['tenant_name'],
                "sector" => $globalUser['sector']
            ]
        ]);
        exit;
    }

    // 2. Fallback to Legacy/Local Users (Normal employees)
    $stmt = $pdo->prepare("
        SELECT u.*, t.sector 
        FROM users u 
        LEFT JOIN kiam_tenants t ON u.clinic_id = t.id 
        WHERE u.email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && ($password === $user['password_hash'] || password_verify($password, $user['password_hash']))) {
        unset($user['password_hash']);

        if (!empty($user['clinic_id'])) {
            ensureClinicForTenant($pdo, $user['clinic_id']);
        }
        
        $clinic = null;
        if ($user['clinic_id']) {
            $stmt = $pdo->prepare("SELECT * FROM clinics WHERE id = ?");
            $stmt->execute([$user['clinic_id']]);
            $clinic = $stmt->fetch();
        }

        // Issue JWT token (Legacy User context)
        $token = JWT::encode([
            'id' => $user['id'],
            'email' => $user['email'],
            'tenant_id' => $user['clinic_id'],
            'role' => $user['role']
        ]);
        
        sendResponse([
            "status" => "success",
            "token" => $token, 
            "user" => [
                "id" => $user['id'],
                "email" => $user['email'],
                "name" => $user['name'],
                "role" => $user['role'],
                "clinicId" => $user['clinic_id'],
                "sector" => $user['sector'] ?: 'health' // Dynamic sector from tenant table
            ],
            "clinic" => $clinic
        ]);
    } else {
        sendResponse(["status" => "error", "message" => "Identifiants invalides"], 401);
    }
} elseif ($action === 'impersonate') {
    // SECURITY: This should only be allowed for saas_admin
    $tenantId = $data['tenantId'];
    
    $stmt = $pdo->prepare("SELECT * FROM kiam_tenants WHERE id = ?");
    $stmt->execute([$tenantId]);
    $tenant = $stmt->fetch();
    
    if (!$tenant) {
        sendResponse(["status" => "error", "message" => "Tenant inconnu"], 404);
    }

    ensureClinicForTenant($pdo, $tenant['id']);
    
    // Issue Impersonated JWT token
    $token = JWT::encode([
        'id' => 'impersonated',
        'email' => 'support@kiam.tech',
        'tenant_id' => $tenant['id'],
        'role' => 'clinic_admin',
        'is_impersonated' => true
    ]);

    sendResponse([
        "status" => "success",
        "token" => $token,
        "user" => [
            "id" => "impersonated",
            "email" => "support@kiam.tech",
            "role" => "clinic_admin",
            "clinicId" => $tenant['id'],
            "sector" => $tenant['sector'],
            "name" => $tenant['name'] . " (Impersonation)"
        ],
        "clinic" => $tenant
    ]);
} else {
    sendResponse(["status" => "error", "message" => "Action non reconnue"], 404);
}
?>

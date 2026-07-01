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
        SELECT gu.*, t.name as tenant_name, t.sector, t.subscription_status 
        FROM kiam_global_users gu 
        LEFT JOIN kiam_tenants t ON gu.tenant_id = t.id 
        WHERE gu.email = ?
    ");
    $stmt->execute([$email]);
    $globalUser = $stmt->fetch();

    if ($globalUser && ($password === $globalUser['password_hash'] || password_verify($password, $globalUser['password_hash']))) {
        // Block if suspended
        if ($globalUser['subscription_status'] === 'suspended' && $globalUser['global_role'] !== 'saas_admin') {
            sendResponse([
                "status" => "error", 
                "message" => "Compte suspendu. Contactez l'administrateur.",
                "code" => "TENANT_SUSPENDED"
            ], 403);
        }
        ensureClinicForTenant($pdo, $globalUser['tenant_id']);

        // Map sector → role sectoriel (isolation tenant)
        $sector = $globalUser['sector'] ?? 'health';
        $sectorRole = match($sector) {
            'erp', 'shop'   => 'erp_admin',
            'school'        => 'school_admin',
            'hotel'         => 'clinic_admin',  // Pas encore de rôle hotel_admin
            'health'        => 'clinic_admin',
            'pharmacy'      => 'clinic_admin',
            'enterprise'    => 'clinic_admin',
            default         => 'clinic_admin',
        };
        $frontendRole = $globalUser['global_role'] === 'saas_admin' ? 'saas_admin' : $sectorRole;

        // Issue JWT token
        $token = JWT::encode([
            'id' => $globalUser['id'],
            'email' => $globalUser['email'],
            'tenant_id' => $globalUser['tenant_id'],
            'role' => $frontendRole
        ]);

        sendResponse([
            "status" => "success",
            "token" => $token,
            "user" => [
                "id" => $globalUser['id'],
                "email" => $globalUser['email'],
                "role" => $frontendRole,
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
        SELECT u.*, t.sector, t.subscription_status 
        FROM users u 
        LEFT JOIN kiam_tenants t ON u.clinic_id = t.id 
        WHERE u.email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && ($password === $user['password_hash'] || password_verify($password, $user['password_hash']))) {
        // Block if suspended
        if ($user['subscription_status'] === 'suspended') {
            sendResponse([
                "status" => "error", 
                "message" => "Compte suspendu.",
                "code" => "TENANT_SUSPENDED"
            ], 403);
        }
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
    // Disabled for tenant data privacy
    sendResponse([
        "status" => "error",
        "message" => "Le mode présentation/impersonation est désactivé pour des raisons de confidentialité des données de chaque client."
    ], 403);
} elseif ($action === 'impersonate_demo') {
    $sector = $data['sector'] ?? 'health';
    $name = $data['name'] ?? 'Demo Tenant';
    
    // Create a demo token with a fake tenant_id isolated from real data
    $token = JWT::encode([
        'id' => 'demo_admin',
        'email' => 'demo@saas.com',
        'tenant_id' => 'demo_' . $sector,
        'role' => 'clinic_admin'
    ]);
    
    sendResponse([
        "status" => "success",
        "token" => $token,
        "user" => [
            "id" => "demo_admin",
            "email" => "demo@saas.com",
            "role" => "clinic_admin",
            "global_role" => "tenant_admin",
            "clinicId" => "demo_" . $sector,
            "sector" => $sector,
            "name" => "[DEMO] " . $name
        ],
        "clinic" => [
            "id" => "demo_" . $sector,
            "name" => "[DEMO] " . $name,
            "sector" => $sector
        ]
    ]);
} else {
    sendResponse(["status" => "error", "message" => "Action non reconnue"], 404);
}
?>

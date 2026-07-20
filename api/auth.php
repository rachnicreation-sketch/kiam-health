<?php
require_once 'config.php';
require_once 'functions.php';
require_once 'jwt.php';

$data = getRequestData();
$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if (!$username || !$password) {
        sendResponse(["status" => "error", "message" => "Nom d'utilisateur et mot de passe requis"], 400);
    }

    // 1. Check Global SaaS Users (Master Admins & Tenant Owners)
    $stmt = $pdo->prepare("
        SELECT gu.*, t.name as tenant_name, t.sector, t.subscription_status, t.trial_ends_at
        FROM kiam_global_users gu 
        LEFT JOIN kiam_tenants t ON gu.tenant_id = t.id 
        WHERE gu.username = ?
    ");
    $stmt->execute([$username]);
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
        // Block if trial expired (Forfait Découverte)
        if ($globalUser['subscription_status'] === 'trial' && !empty($globalUser['trial_ends_at']) && $globalUser['global_role'] !== 'saas_admin') {
            if (strtotime($globalUser['trial_ends_at']) < time()) {
                // Set to expired, don't block login, but it will be read-only
                $pdo->prepare("UPDATE kiam_tenants SET subscription_status = 'expired' WHERE id = ?")->execute([$globalUser['tenant_id']]);
                $globalUser['subscription_status'] = 'expired';
            }
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

        // Fetch modules
        $modules = [];
        if ($globalUser['tenant_id']) {
            $modules = getTenantModules($globalUser['tenant_id']);
        }

        // Issue JWT token
        $token = JWT::encode([
            'id' => $globalUser['id'],
            'username' => $globalUser['username'],
            'tenant_id' => $globalUser['tenant_id'],
            'role' => $frontendRole
        ]);

        sendResponse([
            "status" => "success",
            "token" => $token,
            "user" => [
                "id" => $globalUser['id'],
                "username" => $globalUser['username'],
                "role" => $frontendRole,
                "global_role" => $globalUser['global_role'],
                "clinicId" => $globalUser['tenant_id'],
                "sector" => $globalUser['sector'] ?: 'health',
                "name" => $globalUser['tenant_name'] ?: 'Super Admin'
            ],
            "clinic" => [
                "id" => $globalUser['tenant_id'],
                "name" => $globalUser['tenant_name'],
                "sector" => $globalUser['sector'],
                "subscription_status" => $globalUser['subscription_status'],
                "modules_included" => $modules
            ]
        ]);
        exit;
    }

    // 2. Fallback to Legacy/Local Users (Normal employees)
    $stmt = $pdo->prepare("
        SELECT u.*, t.sector, t.name as tenant_name, t.subscription_status, t.trial_ends_at
        FROM users u 
        LEFT JOIN kiam_tenants t ON u.tenant_id = t.id 
        WHERE u.username = ? OR u.email = ?
    ");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();

    if ($user && ($password === ($user['password_hash'] ?? '') || password_verify($password, $user['password_hash'] ?? $user['password'] ?? ''))) {
        // Block if suspended
        if ($user['subscription_status'] === 'suspended') {
            sendResponse([
                "status" => "error", 
                "message" => "Compte suspendu.",
                "code" => "TENANT_SUSPENDED"
            ], 403);
        }
        // Block if trial expired
        if ($user['subscription_status'] === 'trial' && !empty($user['trial_ends_at'])) {
            if (strtotime($user['trial_ends_at']) < time()) {
                $pdo->prepare("UPDATE kiam_tenants SET subscription_status = 'expired' WHERE id = ?")->execute([$user['tenant_id']]);
                $user['subscription_status'] = 'expired';
            }
        }
        unset($user['password_hash'], $user['password']);

        $tenantId = $user['tenant_id'] ?? '';
        
        if (!empty($tenantId)) {
            ensureClinicForTenant($pdo, $tenantId);
        }

        // Fetch modules
        $modules = [];
        if ($tenantId) {
            $modules = getTenantModules($tenantId);
        }

        // Map role to frontend role
        $sector = $user['sector'] ?? 'health';
        $userRole = $user['role'] ?? 'user';
        $frontendRole = in_array($userRole, ['admin', 'superadmin']) ? 'clinic_admin' : $userRole;
        if ($sector === 'school' && $userRole === 'admin') $frontendRole = 'school_admin';
        if ($sector === 'erp' && $userRole === 'admin') $frontendRole = 'erp_admin';

        // Issue JWT token (Local User context)
        $token = JWT::encode([
            'id' => $user['id'],
            'username' => $user['username'],
            'tenant_id' => $tenantId,
            'role' => $frontendRole
        ]);
        
        sendResponse([
            "status" => "success",
            "token" => $token,
            "user" => [
                "id" => $user['id'],
                "username" => $user['username'],
                "role" => $frontendRole,
                "clinicId" => $tenantId,
                "name" => $user['name']
            ],
            "clinic" => [
                "id" => $tenantId,
                "name" => $user['tenant_name'] ?? 'Clinique KIAM',
                "sector" => $sector,
                "subscription_status" => $user['subscription_status'] ?? 'active',
                "modules_included" => $modules
            ]
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

<?php
/**
 * Fonctions utilitaires pour l'API
 */

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function getRequestData() {
    return json_decode(file_get_contents("php://input"), true);
}

function generateId($prefix = '') {
    return $prefix . uniqid();
}

function requireAuth() {
    global $pdo;
    require_once 'jwt.php';
    $token = JWT::getBearerToken();
    if (!$token) {
        sendResponse(["status" => "error", "message" => "Accès non autorisé: Token manquant"], 401);
    }
    $decoded = JWT::decode($token);
    if (!$decoded) {
        sendResponse(["status" => "error", "message" => "Accès non autorisé: Token invalide ou expiré"], 401);
    }

    // Vérification du statut du locataire (sauf pour l'admin SaaS)
    if (isset($decoded['tenant_id']) && $decoded['tenant_id'] && (!isset($decoded['role']) || $decoded['role'] !== 'saas_admin')) {
        $tenantId = $decoded['tenant_id'];
        
        // Skip check for demo tenants
        if (strpos($tenantId, 'demo_') !== 0) {
            $stmt = $pdo->prepare("SELECT subscription_status, trial_ends_at FROM kiam_tenants WHERE id = ?");
            $stmt->execute([$tenantId]);
            $tenant = $stmt->fetch();

            if ($tenant) {
                $status = $tenant['subscription_status'];
                $trialEndsAt = $tenant['trial_ends_at'];

                // Vérification automatique de l'expiration d'essai (J+35)
                if ($status === 'trial' && !empty($trialEndsAt)) {
                    if (strtotime($trialEndsAt) < time()) {
                        $status = 'expired';
                        $upd = $pdo->prepare("UPDATE kiam_tenants SET subscription_status = 'expired' WHERE id = ?");
                        $upd->execute([$tenantId]);
                    }
                }

                if ($status === 'suspended') {
                    sendResponse([
                        "status" => "error", 
                        "message" => "Votre compte est suspendu. Veuillez contacter l'administrateur KIAM.",
                        "code" => "TENANT_SUSPENDED"
                    ], 403);
                }

                if ($status === 'expired') {
                    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
                    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
                    
                    // Bloquer toute modification (POST, PUT, DELETE) sur les données du locataire
                    // Sauf pour les appels à l'authentification et à la facturation
                    if ($method !== 'GET' && 
                        strpos($requestUri, 'auth.php') === false && 
                        strpos($requestUri, 'tenant_billing.php') === false) {
                        sendResponse([
                            "status" => "error",
                            "message" => "Votre abonnement a expiré. Mode lecture seule uniquement. Veuillez renouveler votre offre.",
                            "code" => "TENANT_EXPIRED"
                        ], 403);
                    }
                }
                
                // --- Vérification automatique de l'accès aux modules ---
                $script = basename($_SERVER['SCRIPT_NAME']);
                $moduleRequired = null;
                switch ($script) {
                    case 'hotel.php': $moduleRequired = 'hotel'; break;
                    case 'school.php': $moduleRequired = 'school'; break;
                    case 'pharmacy.php':
                    case 'pharmacy_sales.php': $moduleRequired = 'pharmacy'; break;
                    case 'payrolls.php': $moduleRequired = 'payrolls'; break;
                    case 'employees.php': $moduleRequired = 'hr'; break;
                    case 'patients.php':
                    case 'admissions.php':
                    case 'consultations.php':
                    case 'appointments.php':
                    case 'beds.php':
                    case 'lab_services.php':
                    case 'lab_tests.php':
                    case 'medical_acts.php':
                    case 'medications.php': $moduleRequired = 'health'; break;
                    // ERP is split but we can generally assume 'caisse' or 'inventory' or 'accounting'
                    // For now, if a specific module needs to be checked inside erp.php, we do it there.
                }

                if ($moduleRequired && !checkTenantModuleAccess($tenantId, $moduleRequired)) {
                    sendResponse([
                        "status" => "error", 
                        "message" => "Le module '$moduleRequired' n'est pas inclus dans votre abonnement. Veuillez mettre à niveau votre forfait.",
                        "code" => "MODULE_NOT_INCLUDED"
                    ], 403);
                }
            }
        }
    }

    return $decoded;
}

/**
 * Vérifie si un tenant a accès à un module.
 */
function checkTenantModuleAccess($tenantId, $moduleName) {
    global $pdo;
    
    // Les comptes de démo ont tous les accès
    if (strpos($tenantId, 'demo_') === 0) {
        return true;
    }

    // 1. Vérifier si le module est explicitement actif dans kiam_tenant_modules (ex. add-ons achetés)
    $stmt = $pdo->prepare("SELECT is_active FROM kiam_tenant_modules WHERE tenant_id = ? AND module_name = ?");
    $stmt->execute([$tenantId, $moduleName]);
    $explicit = $stmt->fetch();
    if ($explicit !== false) {
        return (bool)$explicit['is_active'];
    }

    // 2. Vérifier si le module est inclus dans le forfait du tenant
    $stmt = $pdo->prepare("
        SELECT p.modules_included FROM kiam_tenants t
        LEFT JOIN kiam_plans p ON t.plan_id = p.id
        WHERE t.id = ?
    ");
    $stmt->execute([$tenantId]);
    $modules = $stmt->fetchColumn();

    if ($modules) {
        $arr = array_map('trim', explode(',', strtolower($modules)));
        return in_array(strtolower($moduleName), $arr);
    }

    return false;
}

/**
 * Vérifie si le tenant a atteint sa limite d'utilisateurs.
 */
function checkTenantUserLimit($tenantId) {
    global $pdo;

    if (strpos($tenantId, 'demo_') === 0) {
        return true; // pas de limite pour les démos
    }

    // Nombre d'utilisateurs locaux (employés) — colonne peut être clinic_id ou tenant_id
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE tenant_id = ?");
        $stmt->execute([$tenantId]);
        $localCount = (int)$stmt->fetchColumn();
    } catch (Exception $e) {
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE clinic_id = ?");
            $stmt->execute([$tenantId]);
            $localCount = (int)$stmt->fetchColumn();
        } catch (Exception $e2) { $localCount = 0; }
    }

    // Nombre d'utilisateurs globaux (propriétaires, admins)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM kiam_global_users WHERE tenant_id = ?");
    $stmt->execute([$tenantId]);
    $globalCount = (int)$stmt->fetchColumn();

    $totalUsers = $localCount + $globalCount;

    // Récupérer la limite du forfait (ou limite personnalisée si définie)
    $stmt = $pdo->prepare("
        SELECT COALESCE(t.max_users_limit, p.max_users, 3) as max_users
        FROM kiam_tenants t
        LEFT JOIN kiam_plans p ON t.plan_id = p.id
        WHERE t.id = ?
    ");
    $stmt->execute([$tenantId]);
    $limit = (int)$stmt->fetchColumn();

    return $totalUsers < $limit;
}

/**
 * Récupère la liste complète des modules autorisés pour un tenant.
 */
function getTenantModules($tenantId) {
    global $pdo;
    $modules = [];
    
    if (strpos($tenantId, 'demo_') === 0) {
        return ['health', 'pharmacy', 'hotel', 'school', 'erp', 'shop', 'enterprise', 'hr', 'caisse', 'billing', 'clients', 'dashboard', 'inventory', 'procurement', 'suppliers', 'accounting', 'payrolls', 'crm', 'projects', 'reports', 'api', 'ticketing', 'signature'];
    }

    $stmt = $pdo->prepare("
        SELECT p.modules_included FROM kiam_tenants t
        LEFT JOIN kiam_plans p ON t.plan_id = p.id
        WHERE t.id = ?
    ");
    $stmt->execute([$tenantId]);
    $planModules = $stmt->fetchColumn();
    if ($planModules) {
        $modules = array_merge($modules, array_map('trim', explode(',', strtolower($planModules))));
    }

    $stmt = $pdo->prepare("SELECT module_name FROM kiam_tenant_modules WHERE tenant_id = ? AND is_active = 1");
    $stmt->execute([$tenantId]);
    while ($row = $stmt->fetch()) {
        $modules[] = strtolower($row['module_name']);
    }

    return array_values(array_unique($modules));
}

function ensureClinicForTenant(PDO $pdo, ?string $tenantId): string {
    $tenantId = trim((string) $tenantId);
    if ($tenantId === '') {
        sendResponse(["status" => "error", "message" => "Contexte clinique introuvable"], 400);
    }

    // Check if clinic exists with tenant_id column match (preferred) or id match
    $stmt = $pdo->prepare("SELECT id FROM clinics WHERE id = ? OR tenant_id = ? LIMIT 1");
    $stmt->execute([$tenantId, $tenantId]);
    $existingId = $stmt->fetchColumn();
    if ($existingId) {
        return $existingId;
    }

    // Fetch tenant info to create a clinic entry
    $tenantStmt = $pdo->prepare("SELECT name, sector FROM kiam_tenants WHERE id = ?");
    $tenantStmt->execute([$tenantId]);
    $tenant = $tenantStmt->fetch();
    $clinicName = $tenant['name'] ?? ('Espace ' . $tenantId);
    $sector = $tenant['sector'] ?? 'health';

    $clinicId = $tenantId . '_main';
    try {
        $insertStmt = $pdo->prepare("
            INSERT INTO clinics (id, name, sector, tenant_id, subscription_status, plan_id, max_users, created_at)
            VALUES (?, ?, ?, ?, 'active', 'plan_enterprise', 999, NOW())
            ON DUPLICATE KEY UPDATE name = COALESCE(NULLIF(name, ''), VALUES(name))
        ");
        $insertStmt->execute([$clinicId, $clinicName, $sector, $tenantId]);
    } catch (Exception $e) { /* silent */ }

    return $clinicId;
}

function logActivity(PDO $pdo, $tenantId, $userId, $action, $details = null) {
    $id = "LOG-" . time() . rand(10, 99);
    $stmt = $pdo->prepare("INSERT INTO activity_logs (id, tenant_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$id, $tenantId, $userId, $action, $details ? json_encode($details) : null]);
}

function systemAuditLog(PDO $pdo, $clinicId, $userId, $action, $tableName, $recordId, $oldValue = null, $newValue = null) {
    $id = "AUD-" . time() . rand(100, 999);
    $stmt = $pdo->prepare("INSERT INTO system_audit_logs (id, clinic_id, user_id, action, table_name, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id, $clinicId, $userId, $action, $tableName, $recordId, 
        $oldValue ? json_encode($oldValue) : null, 
        $newValue ? json_encode($newValue) : null
    ]);
}

function writeAuditLog(PDO $pdo, string $event, string $userEmail = 'system@kiam.sn', string $status = 'success') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    try {
        $stmt = $pdo->prepare("INSERT INTO kiam_audit_logs (event, user_email, ip_address, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([$event, $userEmail, $ip, $status]);
    } catch(Exception $e) { /* silent */ }
}
?>

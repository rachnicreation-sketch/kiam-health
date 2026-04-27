<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'stats';

// Ensure table exists for plans
try {
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_plans (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(15,2) DEFAULT 0,
        max_users INT DEFAULT 1,
        modules_included TEXT
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT,
        status ENUM('open', 'closed', 'pending') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_tenants (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        sector VARCHAR(50) DEFAULT 'health',
        plan_id VARCHAR(50),
        subscription_status ENUM('active', 'trial', 'past_due', 'canceled') DEFAULT 'trial',
        mrr_value DECIMAL(15,2) DEFAULT 0,
        last_notifications_read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_global_users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255),
        tenant_id VARCHAR(50),
        global_role VARCHAR(20) DEFAULT 'tenant_admin'
    )");
} catch (Exception $e) {}

// CSRF/Auth Check (Simplified for dev)
// Ideally, check for global_role = 'saas_admin'

if ($method === 'GET') {
    if ($action === 'stats') {
        // Global Dashboard Stats
        $totalTenants = $pdo->query("SELECT COUNT(*) FROM kiam_tenants")->fetchColumn();
        $activeTenants = $pdo->query("SELECT COUNT(*) FROM kiam_tenants WHERE subscription_status = 'active'")->fetchColumn();
        $totalMRR = $pdo->query("SELECT SUM(mrr_value) FROM kiam_tenants WHERE subscription_status = 'active'")->fetchColumn() ?: 0;
        $openTickets = $pdo->query("SELECT COUNT(*) FROM kiam_support_tickets WHERE status = 'open'")->fetchColumn();
        
        // Growth Data (Last 6 months) - Using real MRR for the current month
        $growth = [
            ["name" => "Jan", "value" => 0],
            ["name" => "Fév", "value" => 0],
            ["name" => "Mar", "value" => 0],
            ["name" => "Avr", "value" => 0],
            ["name" => "Mai", "value" => 0],
            ["name" => "Juin", "value" => (int)$totalMRR],
        ];

        // Real Modules Usage from DB
        $stmt = $pdo->query("SELECT sector, COUNT(*) as count FROM kiam_tenants GROUP BY sector");
        $sectors = $stmt->fetchAll();
        $modulesUsage = [];
        $colors = ["#1E6FFF", "#00D47E", "#fb923c", "#8b5cf6", "#ec4899"];
        $i = 0;
        foreach ($sectors as $s) {
            $modulesUsage[] = [
                "name" => ucfirst($s['sector']),
                "value" => $totalTenants > 0 ? round(($s['count'] / $totalTenants) * 100) : 0,
                "color" => $colors[$i % count($colors)]
            ];
            $i++;
        }

        sendResponse([
            "totalTenants" => (int)$totalTenants,
            "activeTenants" => (int)$activeTenants,
            "totalMRR" => (float)$totalMRR,
            "openTickets" => (int)$openTickets,
            "growthData" => $growth,
            "modulesUsage" => $modulesUsage
        ]);
    } elseif ($action === 'tenant_detail' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("
            SELECT t.*, p.name as plan_name, gu.email as admin_email
            FROM kiam_tenants t 
            LEFT JOIN kiam_plans p ON t.plan_id = p.id 
            LEFT JOIN kiam_global_users gu ON gu.tenant_id = t.id AND gu.global_role = 'tenant_admin'
            WHERE t.id = ?
        ");
        $stmt->execute([$_GET['id']]);
        $tenant = $stmt->fetch();
        if ($tenant) {
            sendResponse($tenant);
        } else {
            sendResponse(["status" => "error", "message" => "Tenant not found"], 404);
        }
    } elseif ($action === 'tenants') {
        // Full Tenant List with Plan details
        $stmt = $pdo->query("
            SELECT t.*, p.name as plan_name, gu.email as admin_email
            FROM kiam_tenants t 
            LEFT JOIN kiam_plans p ON t.plan_id = p.id 
            LEFT JOIN kiam_global_users gu ON gu.tenant_id = t.id AND gu.global_role = 'tenant_admin'
            ORDER BY t.created_at DESC
        ");
        sendResponse($stmt->fetchAll());

    } elseif ($action === 'modules' && isset($_GET['tenant_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM kiam_tenant_modules WHERE tenant_id = ?");
        $stmt->execute([$_GET['tenant_id']]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'announcements') {
        $stmt = $pdo->query("SELECT * FROM kiam_system_announcements ORDER BY created_at DESC");
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_plans') {
        $stmt = $pdo->query("SELECT * FROM kiam_plans");
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'saas_users') {
        $stmt = $pdo->query("SELECT * FROM kiam_global_users");
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'tickets') {
        $stmt = $pdo->query("
            SELECT st.*, t.name as tenant_name 
            FROM kiam_support_tickets st 
            JOIN kiam_tenants t ON st.tenant_id = t.id 
            ORDER BY st.created_at DESC
        ");
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'saas_invoices') {
        // Return real data or empty array
        sendResponse([]);
    }
} elseif ($method === 'POST') {
    try {
        $data = getRequestData();
        
        if ($action === 'create_tenant') {
            $tenantId = generateId('tnt_');
            
            // 0. Check if Admin Email already exists
            if (isset($data['adminEmail']) && !empty($data['adminEmail'])) {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM kiam_global_users WHERE email = ?");
                $stmt->execute([$data['adminEmail']]);
                if ($stmt->fetchColumn() > 0) {
                    sendResponse(["status" => "error", "message" => "Cet email administrateur (" . $data['adminEmail'] . ") est déjà utilisé."], 400);
                }
            }

            // 1. Create Tenant
            $stmt = $pdo->prepare("INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status) VALUES (?, ?, ?, ?, 'active')");
            $stmt->execute([
                $tenantId,
                $data['name'],
                $data['sector'],
                $data['plan_id']
            ]);

            ensureClinicForTenant($pdo, $tenantId);

            // 2. Create Admin User for this tenant
            if (!empty($data['adminEmail']) && !empty($data['adminPassword'])) {
                $userId = generateId('usr_');
                $stmt = $pdo->prepare("INSERT INTO kiam_global_users (id, email, password_hash, tenant_id, global_role) VALUES (?, ?, ?, ?, 'tenant_admin')");
                $stmt->execute([
                    $userId,
                    $data['adminEmail'],
                    password_hash($data['adminPassword'], PASSWORD_DEFAULT),
                    $tenantId
                ]);
            }

            sendResponse(["status" => "success", "id" => $tenantId]);

        } elseif ($action === 'toggle_module') {
            $stmt = $pdo->prepare("
                INSERT INTO kiam_tenant_modules (tenant_id, module_name, is_active) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE is_active = VALUES(is_active)
            ");
            $stmt->execute([$data['tenantId'], $data['moduleName'], $data['active']]);
            sendResponse(["status" => "success"]);

        } elseif ($action === 'update_tenant') {
            $stmt = $pdo->prepare("UPDATE kiam_tenants SET subscription_status = ?, plan_id = ?, mrr_value = ? WHERE id = ?");
            $stmt->execute([
                $data['status'],
                $data['plan_id'],
                $data['mrr_value'],
                $data['id']
            ]);
            sendResponse(["status" => "success"]);

        } elseif ($action === 'create_announcement') {
            $targetSector = $data['target_sector'] ?? 'all';
            if (str_starts_with($targetSector, 'tenant:')) {
                $targetTenantId = substr($targetSector, 7);
                $tenantStmt = $pdo->prepare("SELECT id FROM kiam_tenants WHERE id = ?");
                $tenantStmt->execute([$targetTenantId]);
                if (!$tenantStmt->fetch()) {
                    sendResponse(["status" => "error", "message" => "Locataire cible introuvable"], 400);
                }
            }

            $stmt = $pdo->prepare("INSERT INTO kiam_system_announcements (title, content, target_sector, expires_at) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $data['title'],
                $data['content'],
                $targetSector,
                $data['expires_at'] ?? null
            ]);
            sendResponse(["status" => "success"]);

        } elseif ($action === 'save_plan') {
            $id = $data['id'] ?? uniqid('plan_');
            $stmt = $pdo->prepare("
                INSERT INTO kiam_plans (id, name, price, max_users, modules_included) 
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), max_users=VALUES(max_users), modules_included=VALUES(modules_included)
            ");
            $stmt->execute([
                $id,
                $data['name'],
                $data['price'],
                $data['max_users'] ?? 0,
                $data['modules_included'] ?? ''
            ]);
            sendResponse(["status" => "success", "id" => $id]);
        }
    } catch (Throwable $e) {
        sendResponse(["status" => "error", "message" => "ERREUR SYSTEME: " . $e->getMessage()], 500);
    }
}
?>

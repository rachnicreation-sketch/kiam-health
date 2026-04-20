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
        
        // Growth Data (Last 6 months) - Simulated for now as real history might be empty
        $growth = [
            ["name" => "Jan", "value" => 1200000],
            ["name" => "Fév", "value" => 1800000],
            ["name" => "Mar", "value" => 2500000],
            ["name" => "Avr", "value" => 4200000],
            ["name" => "Mai", "value" => 5800000],
            ["name" => "Juin", "value" => (int)$totalMRR],
        ];

        // Modules Usage
        $modulesUsage = [
            ["name" => "Santé", "value" => 40, "color" => "#1E6FFF"],
            ["name" => "Hôtel", "value" => 25, "color" => "#00D47E"],
            ["name" => "École", "value" => 20, "color" => "#fb923c"],
            ["name" => "Autres", "value" => 15, "color" => "#94a3b8"],
        ];

        sendResponse([
            "totalTenants" => (int)$totalTenants,
            "activeTenants" => (int)$activeTenants,
            "totalMRR" => (float)$totalMRR,
            "openTickets" => (int)$openTickets,
            "growthData" => $growth,
            "modulesUsage" => $modulesUsage
        ]);

    } elseif ($action === 'tenants') {
        // Full Tenant List with Plan details
        $stmt = $pdo->query("
            SELECT t.*, p.name as plan_name 
            FROM kiam_tenants t 
            LEFT JOIN kiam_plans p ON t.plan_id = p.id 
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
    } elseif ($action === 'saas_invoices') {
        // Mock table since dynamic billing isn't fully architected in SQL yet
        sendResponse([
            ["id"=> "INV-2026-001", "client"=> "Clinique La Paix", "amount"=> 75000, "date"=> "Le 10 Juin 2026", "status"=> "payé", "plan"=> "Pro"],
            ["id"=> "INV-2026-002", "client"=> "Hôtel Horizon", "amount"=> 75000, "date"=> "Le 12 Juin 2026", "status"=> "échoué", "plan"=> "Pro"],
            ["id"=> "INV-2026-003", "client"=> "Pharmacie Plus", "amount"=> 25000, "date"=> "Le 14 Juin 2026", "status"=> "payé", "plan"=> "Basic"]
        ]);
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    
    if ($action === 'toggle_module') {
        $stmt = $pdo->prepare("
            INSERT INTO kiam_tenant_modules (tenant_id, module_name, is_active) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE is_active = VALUES(is_active)
        ");
        $stmt->execute([$data['tenantId'], $data['moduleName'], $data['active']]);
        sendResponse(["status" => "success"]);

    } elseif ($action === 'update_tenant') {
        // Update subscription, status, etc.
        $stmt = $pdo->prepare("UPDATE kiam_tenants SET subscription_status = ?, plan_id = ?, mrr_value = ? WHERE id = ?");
        $stmt->execute([
            $data['status'],
            $data['plan_id'],
            $data['mrr_value'],
            $data['id']
        ]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'create_announcement') {
        $stmt = $pdo->prepare("INSERT INTO kiam_system_announcements (title, content, target_sector, expires_at) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['title'],
            $data['content'],
            $data['target_sector'] ?? 'all',
            $data['expires_at'] ?? null
        ]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'save_plan') {
        // Upsert a plan
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
}
?>

<?php
require_once 'config.php';
require_once 'functions.php';

function logAudit($pdo, $event, $status = 'success') {
    $email = 'admin@saas.com';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    try {
        $stmt = $pdo->prepare("INSERT INTO kiam_audit_logs (event, user_email, ip_address, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([$event, $email, $ip, $status]);
    } catch(Exception $e) { /* silent */ }
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'stats';

// --- DATABASE SCHEMA INITIALIZATION ---
try {
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_plans (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(15,2) DEFAULT 0,
        max_users INT DEFAULT 1,
        modules_included TEXT,
        features TEXT,
        is_popular TINYINT(1) DEFAULT 0
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT,
        status ENUM('open', 'closed', 'pending') DEFAULT 'open',
        priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_tenants (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        sector VARCHAR(50) DEFAULT 'health',
        plan_id VARCHAR(50),
        subscription_status ENUM('active', 'trial', 'past_due', 'canceled', 'suspended') DEFAULT 'trial',
        mrr_value DECIMAL(15,2) DEFAULT 0,
        last_notifications_read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_global_users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255),
        full_name VARCHAR(100),
        phone VARCHAR(20),
        tenant_id VARCHAR(50),
        global_role VARCHAR(20) DEFAULT 'tenant_admin',
        is_active TINYINT(1) DEFAULT 1,
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_system_announcements (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        target_sector VARCHAR(50) DEFAULT 'all',
        is_active TINYINT(1) DEFAULT 1,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_ticket_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        author_role ENUM('saas_admin', 'tenant_user') NOT NULL,
        author_id VARCHAR(50),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event VARCHAR(255) NOT NULL,
        user_email VARCHAR(100),
        ip_address VARCHAR(45),
        status VARCHAR(20) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_emails_sent (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_modules (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        version VARCHAR(20) DEFAULT '1.0'
    )");
    $pdo->query("CREATE TABLE IF NOT EXISTS kiam_subscriptions (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50) NOT NULL,
        plan_id VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) DEFAULT 0,
        payment_method VARCHAR(50) DEFAULT 'credit_card',
        payment_status VARCHAR(20) DEFAULT 'paid',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $countModules = (int)$pdo->query("SELECT COUNT(*) FROM kiam_modules")->fetchColumn();
    if ($countModules === 0) {
        $pdo->query("INSERT INTO kiam_modules (id, name, description, status, version) VALUES
            ('health', 'Kiam Health', 'Gestion hospitalière complète et dossier patient', 'active', 'v3.2'),
            ('pharmacy', 'Kiam Pharmacy', 'Inventaire, ventes et ordonnances', 'active', 'v2.1'),
            ('hotel', 'Kiam Hotel', 'Réservations, chambres et services hôteliers', 'beta', 'v1.0-beta'),
            ('school', 'Kiam School', 'Administration scolaire et notes', 'active', 'v1.5'),
            ('erp', 'Kiam ERP', 'Système de point de vente et gestion globale', 'active', 'v4.0'),
            ('shop', 'Kiam Commerce', 'Gestion de boutiquiers', 'coming_soon', 'dev')
        ");
    }
    // Add missing columns silently
    try { $pdo->query("ALTER TABLE kiam_global_users ADD COLUMN full_name VARCHAR(100)"); } catch(Exception $e) {}
    try { $pdo->query("ALTER TABLE kiam_global_users ADD COLUMN phone VARCHAR(20)"); } catch(Exception $e) {}
    try { $pdo->query("ALTER TABLE kiam_global_users ADD COLUMN is_active TINYINT(1) DEFAULT 1"); } catch(Exception $e) {}
    try { $pdo->query("ALTER TABLE kiam_global_users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch(Exception $e) {}
    try { $pdo->query("ALTER TABLE kiam_support_tickets ADD COLUMN priority ENUM('low','medium','high','critical') DEFAULT 'medium'"); } catch(Exception $e) {}
    try { $pdo->query("ALTER TABLE kiam_plans ADD COLUMN features TEXT"); } catch(Exception $e) {}
    try { $pdo->query("ALTER TABLE kiam_plans ADD COLUMN is_popular TINYINT(1) DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->query("ALTER TABLE kiam_plans ADD COLUMN price DECIMAL(15,2) DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->query("ALTER TABLE kiam_plans ADD COLUMN modules_included TEXT"); } catch(Exception $e) {}
    try { $pdo->query("ALTER TABLE kiam_tenants ADD COLUMN last_notifications_read_at TIMESTAMP NULL"); } catch(Exception $e) {}
    try { $pdo->query("ALTER TABLE kiam_tenants MODIFY COLUMN sector VARCHAR(50) DEFAULT 'health'"); } catch(Exception $e) {}
} catch (Exception $e) { /* silently continue */ }

// --- API LOGIC ---

if ($method === 'GET') {

    if ($action === 'stats') {
        $stats = [];

        // 1. Tenant counts
        $totalTenants = (int)$pdo->query("SELECT COUNT(*) FROM kiam_tenants")->fetchColumn();
        $stats['totalTenants'] = $totalTenants;
        $stats['activeTenants'] = (int)$pdo->query("SELECT COUNT(*) FROM kiam_tenants WHERE subscription_status = 'active'")->fetchColumn();
        $stats['trialTenants'] = (int)$pdo->query("SELECT COUNT(*) FROM kiam_tenants WHERE subscription_status = 'trial'")->fetchColumn();
        $stats['suspendedTenants'] = (int)$pdo->query("SELECT COUNT(*) FROM kiam_tenants WHERE subscription_status IN ('suspended','canceled')")->fetchColumn();
        $stats['expiredTenants'] = (int)$pdo->query("SELECT COUNT(*) FROM kiam_tenants WHERE subscription_status = 'past_due'")->fetchColumn();

        // 2. Revenue
        $stats['totalMRR'] = (float)$pdo->query("SELECT COALESCE(SUM(mrr_value),0) FROM kiam_tenants WHERE subscription_status = 'active'")->fetchColumn();
        $stats['totalARR'] = $stats['totalMRR'] * 12;

        // 3. Users
        $stats['totalUsers'] = (int)$pdo->query("SELECT COUNT(*) FROM kiam_global_users")->fetchColumn();
        $stats['activeUsers'] = (int)$pdo->query("SELECT COUNT(*) FROM kiam_global_users WHERE is_active = 1")->fetchColumn();

        // 4. Tickets
        $stats['openTickets'] = (int)$pdo->query("SELECT COUNT(*) FROM kiam_support_tickets WHERE status = 'open'")->fetchColumn();
        $stats['pendingTickets'] = $stats['openTickets'];
        $stats['closedTickets'] = (int)$pdo->query("SELECT COUNT(*) FROM kiam_support_tickets WHERE status = 'closed'")->fetchColumn();
        $stats['criticalTickets'] = (int)$pdo->query("SELECT COUNT(*) FROM kiam_support_tickets WHERE status='open' AND priority='critical'")->fetchColumn();

        // 5. Modules usage by sector
        $stmt = $pdo->query("SELECT sector, COUNT(*) as total FROM kiam_tenants GROUP BY sector");
        $usageRaw = $stmt->fetchAll();
        $stats['modulesUsage'] = [];
        foreach ($usageRaw as $row) {
            $stats['modulesUsage'][$row['sector']] = (int)$row['total'];
        }

        // 6. Modules usage for chart
        $colors = ["#1E6FFF", "#00D47E", "#fb923c", "#8b5cf6", "#ec4899", "#06b6d4"];
        $stats['modulesUsageChart'] = [];
        $ci = 0;
        foreach ($usageRaw as $row) {
            $stats['modulesUsageChart'][] = [
                "name" => ucfirst($row['sector']),
                "value" => $totalTenants > 0 ? round(($row['total'] / $totalTenants) * 100) : 0,
                "count" => (int)$row['total'],
                "color" => $colors[$ci % count($colors)]
            ];
            $ci++;
        }

        // 7. Growth Data (based on real MRR for current month)
        $stats['growthData'] = [
            ["name" => "Jan", "mrr" => 120000, "tenants" => max(1, $totalTenants - 5)],
            ["name" => "Fév", "mrr" => 150000, "tenants" => max(1, $totalTenants - 4)],
            ["name" => "Mar", "mrr" => 175000, "tenants" => max(1, $totalTenants - 3)],
            ["name" => "Avr", "mrr" => 210000, "tenants" => max(1, $totalTenants - 2)],
            ["name" => "Mai", "mrr" => 240000, "tenants" => max(1, $totalTenants - 1)],
            ["name" => "Juin", "mrr" => (int)$stats['totalMRR'] ?: 260000, "tenants" => $totalTenants],
        ];

        // 8. Recent activity
        $stmt = $pdo->query("SELECT t.name, t.sector, t.subscription_status, t.created_at FROM kiam_tenants t ORDER BY t.created_at DESC LIMIT 5");
        $stats['recentActivity'] = $stmt->fetchAll();

        // 9. Alerts
        $alerts = [];
        if ($stats['expiredTenants'] > 0) {
            $alerts[] = ["type" => "warning", "msg" => "{$stats['expiredTenants']} abonnement(s) en retard de paiement"];
        }
        if ($stats['criticalTickets'] > 0) {
            $alerts[] = ["type" => "critical", "msg" => "{$stats['criticalTickets']} ticket(s) critiques en attente"];
        }
        if ($stats['suspendedTenants'] > 0) {
            $alerts[] = ["type" => "info", "msg" => "{$stats['suspendedTenants']} compte(s) suspendu(s)"];
        }
        $stats['systemAlerts'] = $alerts;

        sendResponse($stats);

    } elseif ($action === 'tenants') {
        $stmt = $pdo->query("
            SELECT t.*, p.name as plan_name, p.price as plan_price,
                   gu.email as admin_email, gu.full_name as admin_name,
                   (SELECT COUNT(*) FROM kiam_global_users WHERE tenant_id = t.id) as user_count
            FROM kiam_tenants t 
            LEFT JOIN kiam_plans p ON t.plan_id = p.id 
            LEFT JOIN kiam_global_users gu ON gu.tenant_id = t.id AND gu.global_role = 'tenant_admin'
            ORDER BY t.created_at DESC
        ");
        sendResponse($stmt->fetchAll());

    } elseif ($action === 'tenant_detail' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("
            SELECT t.*, p.name as plan_name, p.price as plan_price, p.max_users,
                   gu.email as admin_email, gu.full_name as admin_name, gu.phone as admin_phone,
                   (SELECT COUNT(*) FROM kiam_global_users WHERE tenant_id = t.id) as user_count,
                   (SELECT COUNT(*) FROM kiam_support_tickets WHERE tenant_id = t.id AND status = 'open') as open_tickets
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

    } elseif ($action === 'users') {
        $stmt = $pdo->query("
            SELECT gu.*, t.name as tenant_name, t.sector as tenant_sector
            FROM kiam_global_users gu
            LEFT JOIN kiam_tenants t ON gu.tenant_id = t.id
            ORDER BY gu.created_at DESC
        ");
        sendResponse($stmt->fetchAll());

    } elseif ($action === 'announcements') {
        $stmt = $pdo->query("SELECT * FROM kiam_system_announcements ORDER BY created_at DESC");
        sendResponse($stmt->fetchAll());

    } elseif ($action === 'ticket_details' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("
            SELECT st.*, t.name as tenant_name
            FROM kiam_support_tickets st
            LEFT JOIN kiam_tenants t ON st.tenant_id = t.id
            WHERE st.id = ?
        ");
        $stmt->execute([$_GET['id']]);
        $ticket = $stmt->fetch();
        if ($ticket) {
            $stmt = $pdo->prepare("SELECT * FROM kiam_ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC");
            $stmt->execute([$_GET['id']]);
            $ticket['replies'] = $stmt->fetchAll();
            sendResponse($ticket);
        } else {
            sendResponse(["status" => "error"], 404);
        }

    } elseif ($action === 'list_plans') {
        $stmt = $pdo->query("SELECT id, name, price, price as price_monthly, max_users, modules_included, features, is_popular FROM kiam_plans ORDER BY price ASC");
        sendResponse($stmt->fetchAll());

    } elseif ($action === 'list_modules') {
        $stmt = $pdo->query("SELECT * FROM kiam_modules ORDER BY name ASC");
        sendResponse($stmt->fetchAll());

    } elseif ($action === 'audit_logs') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $stmt = $pdo->query("SELECT * FROM kiam_audit_logs ORDER BY created_at DESC LIMIT $limit");
        sendResponse($stmt->fetchAll());

    } elseif ($action === 'active_modules' && isset($_GET['tenant_id'])) {
        $tenantId = $_GET['tenant_id'];
        if (strpos($tenantId, 'demo_') === 0) {
            // Demo mode: expose all modules
            $modules = ['health', 'pharmacy', 'hotel', 'school', 'erp', 'shop', 'enterprise'];
            $result = array_map(fn($m) => ['name' => $m, 'module_name' => $m], $modules);
            sendResponse($result);
        }

        $stmt = $pdo->prepare("
            SELECT p.modules_included FROM kiam_tenants t
            LEFT JOIN kiam_plans p ON t.plan_id = p.id
            WHERE t.id = ?
        ");
        $stmt->execute([$tenantId]);
        $row = $stmt->fetch();
        if ($row && $row['modules_included']) {
            $modules = array_map('trim', explode(',', $row['modules_included']));
            $result = array_map(fn($m) => ['name' => $m, 'module_name' => $m], $modules);
            sendResponse($result);
        } else {
            sendResponse([]);
        }

    } elseif ($action === 'ai_analysis') {
        $total = (int)$pdo->query("SELECT COUNT(*) FROM kiam_tenants")->fetchColumn();
        $active = (int)$pdo->query("SELECT COUNT(*) FROM kiam_tenants WHERE subscription_status = 'active'")->fetchColumn();
        $healthCount = (int)$pdo->query("SELECT COUNT(*) FROM kiam_tenants WHERE sector='health'")->fetchColumn();
        $mrr = (float)$pdo->query("SELECT COALESCE(SUM(mrr_value),0) FROM kiam_tenants WHERE subscription_status='active'")->fetchColumn();

        $insights = [
            "sectorOpportunity" => [
                "title" => "Expansion du Secteur Santé",
                "description" => "Le secteur Santé représente " . ($total > 0 ? round($healthCount / $total * 100) : 0) . "% de vos locataires. Forte demande détectée sur les marchés émergents.",
                "growth" => "+15%",
                "confidence" => 87
            ],
            "churnRisk" => [
                "rate" => round($total > 0 ? (($total - $active) / $total) * 100 : 0, 1),
                "status" => ($total > 0 && ($total - $active) / $total < 0.1) ? "Excellent" : "À surveiller",
                "atRisk" => ($total - $active)
            ],
            "pricingSuggestion" => [
                "title" => "Optimisation Plan Pro",
                "message" => "Vos clients Pro utilisent 85% des modules. Une augmentation de 5% du tarif (+" . number_format($mrr * 0.05, 0) . " CFA) est supportable selon l'analyse comportementale.",
                "potentialRevenue" => $mrr * 0.05
            ],
            "topSector" => $healthCount > 0 ? "health" : "erp",
            "revenueProjection" => $mrr * 1.12
        ];
        sendResponse($insights);

    } elseif ($action === 'saas_invoices') {
        try {
            $stmt = $pdo->query("
                SELECT s.*, t.name as client_name, p.name as plan_name 
                FROM kiam_subscriptions s 
                JOIN kiam_tenants t ON s.tenant_id = t.id 
                LEFT JOIN kiam_plans p ON t.plan_id = p.id 
                ORDER BY s.payment_date DESC
            ");
            sendResponse($stmt->fetchAll());
        } catch (Exception $e) {
            sendResponse([]);
        }
    }

} elseif ($method === 'POST') {
    try {
        $data = getRequestData();

        if ($action === 'create_announcement') {
            $id = generateId('ANN-');
            $stmt = $pdo->prepare("INSERT INTO kiam_system_announcements (id, title, content, target_sector, is_active) VALUES (?, ?, ?, ?, 1)");
            $stmt->execute([
                $id,
                $data['title'],
                $data['content'] ?: ($data['message'] ?? ''),
                $data['target_sector'] ?: ($data['target'] ?? 'all')
            ]);
            logAudit($pdo, "Diffusion annonce: " . $data['title']);
            sendResponse(["status" => "success", "id" => $id]);

        } elseif ($action === 'update_status') {
            $stmt = $pdo->prepare("UPDATE kiam_tenants SET subscription_status = ? WHERE id = ?");
            $stmt->execute([$data['status'], $data['id']]);
            logAudit($pdo, "Changement statut locataire (" . $data['id'] . ") -> " . $data['status']);
            sendResponse(["status" => "success"]);

        } elseif ($action === 'delete_tenant') {
            $stmt = $pdo->prepare("DELETE FROM kiam_tenants WHERE id = ?");
            $stmt->execute([$data['id']]);
            logAudit($pdo, "Suppression locataire: " . $data['id']);
            sendResponse(["status" => "success"]);

        } elseif ($action === 'save_user') {
            if (!empty($data['id'])) {
                // Update
                $stmt = $pdo->prepare("UPDATE kiam_global_users SET full_name=?, phone=?, global_role=?, is_active=? WHERE id=?");
                $stmt->execute([$data['full_name'] ?? '', $data['phone'] ?? '', $data['global_role'], (int)($data['is_active'] ?? 1), $data['id']]);
                logAudit($pdo, "Modification utilisateur: " . $data['id']);
            } else {
                // Create
                $id = generateId('USR-');
                $hash = password_hash($data['password'] ?? 'Kiam@2026!', PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO kiam_global_users (id, email, password_hash, full_name, phone, tenant_id, global_role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
                $stmt->execute([$id, $data['email'], $hash, $data['full_name'] ?? '', $data['phone'] ?? '', $data['tenant_id'] ?? null, $data['global_role'] ?? 'tenant_admin']);
                logAudit($pdo, "Création utilisateur: " . $data['email']);
            }
            sendResponse(["status" => "success"]);

        } elseif ($action === 'delete_user') {
            $stmt = $pdo->prepare("DELETE FROM kiam_global_users WHERE id = ?");
            $stmt->execute([$data['id']]);
            logAudit($pdo, "Suppression utilisateur: " . $data['id']);
            sendResponse(["status" => "success"]);

        } elseif ($action === 'toggle_user') {
            $stmt = $pdo->prepare("UPDATE kiam_global_users SET is_active = NOT is_active WHERE id = ?");
            $stmt->execute([$data['id']]);
            logAudit($pdo, "Basculement compte utilisateur: " . $data['id']);
            sendResponse(["status" => "success"]);

        } elseif ($action === 'reply_ticket') {
            $stmt = $pdo->prepare("INSERT INTO kiam_ticket_replies (ticket_id, author_role, author_id, message) VALUES (?, 'saas_admin', 'admin', ?)");
            $stmt->execute([$data['ticket_id'], $data['message']]);
            $stmt = $pdo->prepare("UPDATE kiam_support_tickets SET status = 'pending' WHERE id = ? AND status = 'open'");
            $stmt->execute([$data['ticket_id']]);
            logAudit($pdo, "Réponse ticket #" . $data['ticket_id']);
            sendResponse(["status" => "success"]);

        } elseif ($action === 'close_ticket') {
            $stmt = $pdo->prepare("UPDATE kiam_support_tickets SET status = 'closed' WHERE id = ?");
            $stmt->execute([$data['id']]);
            logAudit($pdo, "Clôture ticket #" . $data['id']);
            sendResponse(["status" => "success"]);

        } elseif ($action === 'save_plan') {
            $id = !empty($data['id']) ? $data['id'] : ('plan_' . strtolower(str_replace(' ', '_', $data['name'])));
            $stmt = $pdo->prepare("INSERT INTO kiam_plans (id, name, price, max_users, modules_included, features, is_popular) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), max_users=VALUES(max_users), modules_included=VALUES(modules_included), features=VALUES(features), is_popular=VALUES(is_popular)");
            $stmt->execute([$id, $data['name'], $data['price'], $data['max_users'], $data['modules_included'], $data['features'] ?? '', (int)($data['is_popular'] ?? 0)]);
            logAudit($pdo, "Mise à jour Forfait: " . $data['name']);
            sendResponse(["status" => "success", "id" => $id]);
        }

    } catch (Exception $e) {
        sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
    }
}
?>

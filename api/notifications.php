<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$auth = requireAuth();
$clinicId = $auth['tenant_id'] ?? null;

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS kiam_notification_reads (
            tenant_id VARCHAR(50) NOT NULL,
            notification_id VARCHAR(100) NOT NULL,
            is_read TINYINT(1) DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (tenant_id, notification_id)
        )
    ");
} catch (Throwable $e) {}

function saveNotificationReadState(PDO $pdo, string $tenantId, string $notificationId, bool $isRead): void {
    $stmt = $pdo->prepare("
        INSERT INTO kiam_notification_reads (tenant_id, notification_id, is_read)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE is_read = VALUES(is_read), updated_at = CURRENT_TIMESTAMP
    ");
    $stmt->execute([$tenantId, $notificationId, $isRead ? 1 : 0]);
}

if ($method === 'POST') {
    $data = getRequestData() ?: [];
    $action = $_GET['action'] ?? '';

    if ($action === 'mark_read') {
        $notificationIds = [];
        if (!empty($data['notificationId'])) $notificationIds[] = $data['notificationId'];
        if (!empty($data['notificationIds']) && is_array($data['notificationIds'])) $notificationIds = array_merge($notificationIds, $data['notificationIds']);
        
        foreach (array_unique($notificationIds) as $id) {
            saveNotificationReadState($pdo, $clinicId, $id, true);
        }
        sendResponse(["status" => "success"]);
    }
}

if ($method === 'GET') {
    if (!$clinicId) sendResponse(["status" => "error", "message" => "Clinic ID manquant"], 400);

    $notifications = [];

    // 0. Get Tenant Info (Sector)
    $stmt = $pdo->prepare("SELECT sector FROM kiam_tenants WHERE id = ?");
    $stmt->execute([$clinicId]);
    $tenantSector = $stmt->fetchColumn() ?: 'all';

    // 1. System Announcements (Filtered by sector or specific tenant ID)
    $stmt = $pdo->prepare("
        SELECT * FROM kiam_system_announcements 
        WHERE is_active = 1 
        AND (expires_at IS NULL OR expires_at > NOW()) 
        AND (target_sector = 'all' OR target_sector = ? OR target_sector = ?)
        ORDER BY created_at DESC LIMIT 5
    ");
    $stmt->execute([$tenantSector, "tenant:" . $clinicId]);
    foreach ($stmt->fetchAll() as $sys) {
        $notifications[] = [
            "id" => "ann-" . $sys['id'],
            "title" => $sys['title'],
            "message" => $sys['content'],
            "type" => "system",
            "priority" => "medium",
            "time" => date('d/m/Y H:i', strtotime($sys['created_at'])),
            "path" => "/dashboard"
        ];
    }

    // 2. Stock Alerts (Medications)
    try {
        $stmt = $pdo->prepare("SELECT * FROM medications WHERE clinic_id = ? AND stock < threshold");
        $stmt->execute([$clinicId]);
        foreach ($stmt->fetchAll() as $med) {
            $notifications[] = [
                "id" => "stock-" . $med['id'],
                "title" => "Stock Critique",
                "message" => "Le produit " . $med['name'] . " est presque épuisé (" . $med['stock'] . ")",
                "type" => "inventory",
                "priority" => "high",
                "time" => "Maintenant",
                "path" => "/erp/inventory"
            ];
        }
    } catch (Throwable $e) {}

    // 3. Upcoming Appointments (Today)
    try {
        $stmt = $pdo->prepare("
            SELECT a.*, p.name as patient_name 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            WHERE a.clinic_id = ? AND a.appointment_date = CURDATE() AND a.status = 'pending'
        ");
        $stmt->execute([$clinicId]);
        foreach ($stmt->fetchAll() as $app) {
            $notifications[] = [
                "id" => "app-" . $app['id'],
                "title" => "Rendez-vous aujourd'hui",
                "message" => "RDV avec " . $app['patient_name'] . " à " . substr($app['appointment_time'], 0, 5),
                "type" => "appointment",
                "priority" => "medium",
                "time" => substr($app['appointment_time'], 0, 5),
                "path" => "/appointments"
            ];
        }
    } catch (Throwable $e) {}

    // 4. Overdue Invoices (Pending for more than 7 days)
    try {
        $stmt = $pdo->prepare("
            SELECT i.*, p.name as patient_name 
            FROM invoices i 
            JOIN patients p ON i.patient_id = p.id 
            WHERE i.clinic_id = ? AND i.status = 'pending' AND i.invoice_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ");
        $stmt->execute([$clinicId]);
        foreach ($stmt->fetchAll() as $inv) {
            $notifications[] = [
                "id" => "inv-" . $inv['id'],
                "title" => "Facture Impayée",
                "message" => "Facture " . $inv['id'] . " pour " . $inv['patient_name'] . " est en retard",
                "type" => "billing",
                "priority" => "high",
                "time" => "Retard",
                "path" => "/billing"
            ];
        }
    } catch (Throwable $e) {}

    // 5. Transverse/Sector-Specific alerts
    if ($tenantSector === 'school') {
        $notifications[] = [
            "id" => "school-canteen-alert",
            "title" => "Restauration",
            "message" => "Veuillez mettre à jour le menu du réfectoire pour la semaine.",
            "type" => "school",
            "priority" => "low",
            "time" => "Aujourd'hui",
            "path" => "/school/canteen"
        ];
    } elseif ($tenantSector === 'hotel') {
        $notifications[] = [
            "id" => "hotel-hk-alert",
            "title" => "Housekeeping",
            "message" => "Chambre 102 signalée sale. Assignation requise.",
            "type" => "hotel",
            "priority" => "medium",
            "time" => "Aujourd'hui",
            "path" => "/hotel/housekeeping"
        ];
    } elseif ($tenantSector === 'enterprise') {
        $notifications[] = [
            "id" => "enterprise-task-alert",
            "title" => "Tâches en retard",
            "message" => "Vous avez des tâches de projet non complétées.",
            "type" => "enterprise",
            "priority" => "medium",
            "time" => "Important",
            "path" => "/enterprise/tasks"
        ];
    } elseif ($tenantSector === 'pharmacy') {
        $notifications[] = [
            "id" => "pharmacy-expiry-alert",
            "title" => "Lots critiques",
            "message" => "Des médicaments du Lot LT-2291 arrivent à expiration.",
            "type" => "pharmacy",
            "priority" => "high",
            "time" => "Urgent",
            "path" => "/pharmacy/expiry-alerts"
        ];
    }

    // Fetch read status
    $readMap = [];
    $notificationIds = array_column($notifications, 'id');
    if (!empty($notificationIds)) {
        $placeholders = implode(',', array_fill(0, count($notificationIds), '?'));
        $stmt = $pdo->prepare("SELECT notification_id, is_read FROM kiam_notification_reads WHERE tenant_id = ? AND notification_id IN ($placeholders)");
        $stmt->execute(array_merge([$clinicId], $notificationIds));
        foreach ($stmt->fetchAll() as $row) {
            $readMap[$row['notification_id']] = (bool) $row['is_read'];
        }
    }

    foreach ($notifications as &$n) {
        $n['isRead'] = $readMap[$n['id']] ?? false;
    }

    sendResponse($notifications);
}
?>

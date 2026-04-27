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
} catch (Throwable $e) {
}

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

    if (!$clinicId) {
        sendResponse(["status" => "error", "message" => "Clinic ID manquant"], 400);
    }

    if ($action === 'mark_read') {
        $notificationIds = [];

        if (!empty($data['notificationId'])) {
            $notificationIds[] = $data['notificationId'];
        }

        if (!empty($data['notificationIds']) && is_array($data['notificationIds'])) {
            $notificationIds = array_merge($notificationIds, $data['notificationIds']);
        }

        $notificationIds = array_values(array_unique(array_filter($notificationIds)));

        foreach ($notificationIds as $notificationId) {
            saveNotificationReadState($pdo, $clinicId, $notificationId, true);
        }

        try {
            $stmt = $pdo->prepare("UPDATE kiam_tenants SET last_notifications_read_at = NOW() WHERE id = ?");
            $stmt->execute([$clinicId]);
        } catch (Throwable $e) {
        }

        sendResponse(["status" => "success"]);
    }

    if ($action === 'mark_unread') {
        if (empty($data['notificationId'])) {
            sendResponse(["status" => "error", "message" => "Notification introuvable"], 400);
        }

        saveNotificationReadState($pdo, $clinicId, $data['notificationId'], false);
        sendResponse(["status" => "success"]);
    }

    if (!isset($data['title']) || !isset($data['message'])) {
        sendResponse(["status" => "error", "message" => "Donnees incompletes"], 400);
    }

    $target = $data['target_audience'] ?? 'all';

    $stmt = $pdo->prepare("INSERT INTO kiam_system_announcements (title, content, target_sector) VALUES (?, ?, ?)");
    if ($stmt->execute([$data['title'], $data['message'], $target])) {
        sendResponse(["status" => "success", "message" => "Notification diffusee avec succes"]);
    }

    sendResponse(["status" => "error", "message" => "Erreur DB"], 500);
}

if ($method === 'GET') {
    if (!$clinicId) {
        sendResponse(["status" => "error", "message" => "Clinic ID manquant"], 400);
    }

    $notifications = [];

    $tenantStmt = $pdo->prepare("SELECT id, sector, plan_id FROM kiam_tenants WHERE id = ?");
    $tenantStmt->execute([$clinicId]);
    $tenant = $tenantStmt->fetch();

    if ($tenant) {
        $tenantTarget = 'tenant:' . $tenant['id'];

        $announcementStmt = $pdo->prepare("
            SELECT *
            FROM kiam_system_announcements
            WHERE is_active = 1
              AND (expires_at IS NULL OR expires_at > NOW())
              AND (
                    target_sector = 'all'
                    OR target_sector = ?
                    OR target_sector = ?
                    OR target_sector = ?
                    OR (target_sector = 'plan_pro' AND ? = 'plan_enterprise')
                  )
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $announcementStmt->execute([
            $tenant['sector'],
            $tenant['plan_id'],
            $tenantTarget,
            $tenant['plan_id']
        ]);

        foreach ($announcementStmt->fetchAll() as $sys) {
            $notifications[] = [
                "id" => "ann-" . $sys['id'],
                "title" => $sys['title'],
                "message" => $sys['content'],
                "type" => "system",
                "priority" => "medium",
                "time" => date('d/m/Y H:i', strtotime($sys['created_at'])),
                "createdAt" => $sys['created_at'],
                "path" => "/dashboard"
            ];
        }
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM medications WHERE clinic_id = ? AND stock < 10");
        $stmt->execute([$clinicId]);
        foreach ($stmt->fetchAll() as $med) {
            $notifications[] = [
                "id" => "stock-" . $med['id'],
                "title" => "Stock Faible",
                "message" => "Le stock de " . $med['name'] . " est critique (" . $med['stock'] . ")",
                "type" => "inventory",
                "priority" => "high",
                "time" => "Maintenant",
                "createdAt" => null,
                "path" => "/pharmacy"
            ];
        }
    } catch (Throwable $e) {
    }

    try {
        $stmt = $pdo->prepare("
            SELECT lt.*, p.name as patient_name
            FROM lab_tests lt
            JOIN patients p ON lt.patient_id = p.id
            WHERE lt.clinic_id = ? AND lt.status = 'pending'
        ");
        $stmt->execute([$clinicId]);
        foreach ($stmt->fetchAll() as $lab) {
            $notifications[] = [
                "id" => "lab-" . $lab['id'],
                "title" => "Analyse en attente",
                "message" => "Nouvelle analyse pour " . $lab['patient_name'],
                "type" => "lab",
                "priority" => "medium",
                "time" => "Aujourd'hui",
                "createdAt" => null,
                "path" => "/laboratory"
            ];
        }
    } catch (Throwable $e) {
    }

    $readMap = [];
    $notificationIds = array_column($notifications, 'id');
    if (!empty($notificationIds)) {
        $placeholders = implode(',', array_fill(0, count($notificationIds), '?'));
        $params = array_merge([$clinicId], $notificationIds);
        $stmt = $pdo->prepare("
            SELECT notification_id, is_read
            FROM kiam_notification_reads
            WHERE tenant_id = ? AND notification_id IN ($placeholders)
        ");
        $stmt->execute($params);
        foreach ($stmt->fetchAll() as $row) {
            $readMap[$row['notification_id']] = (bool) $row['is_read'];
        }
    }

    foreach ($notifications as &$notification) {
        $notification['isRead'] = $readMap[$notification['id']] ?? false;
    }
    unset($notification);

    sendResponse($notifications);
}
?>

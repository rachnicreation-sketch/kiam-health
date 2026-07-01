<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$role = $auth['role'] ?? '';
$tenantId = $auth['tenant_id'] ?? null;
$userId = $auth['id'] ?? null;

if ($method === 'GET') {
    if ($action === 'list') {
        if ($role === 'saas_admin') {
            $stmt = $pdo->query("
                SELECT t.*, tn.name as tenant_name, t.description as message
                FROM kiam_support_tickets t
                JOIN kiam_tenants tn ON t.tenant_id = tn.id
                ORDER BY t.created_at DESC
            ");
            sendResponse($stmt->fetchAll());
        }

        if (!$tenantId) {
            sendResponse(["status" => "error", "message" => "Tenant introuvable"], 400);
        }

        $stmt = $pdo->prepare("
            SELECT t.*, tn.name as tenant_name, t.description as message
            FROM kiam_support_tickets t
            JOIN kiam_tenants tn ON t.tenant_id = tn.id
            WHERE t.tenant_id = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$tenantId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData() ?: [];

    if ($action === 'update_status') {
        if ($role !== 'saas_admin') {
            sendResponse(["status" => "error", "message" => "Acces refuse"], 403);
        }

        $stmt = $pdo->prepare("UPDATE kiam_support_tickets SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $data['id']]);
        sendResponse(["status" => "success"]);
    }

    if ($action === 'create_ticket') {
        if (!$tenantId || !$userId) {
            sendResponse(["status" => "error", "message" => "Contexte utilisateur introuvable"], 400);
        }

        $subject = trim($data['subject'] ?? '');
        $description = trim($data['description'] ?? '');
        $priority = trim($data['priority'] ?? 'medium');
        $notificationId = trim($data['notificationId'] ?? '');

        if ($subject === '' || $description === '') {
            sendResponse(["status" => "error", "message" => "Sujet et message requis"], 400);
        }

        $validPriorities = ['low', 'medium', 'high', 'critical'];
        if (!in_array($priority, $validPriorities, true)) {
            $priority = 'medium';
        }

        $ticketId = generateId('ticket_');
        if ($notificationId !== '') {
            $description = "[Notification: " . $notificationId . "]\n" . $description;
        }

        $stmt = $pdo->prepare("
            INSERT INTO kiam_support_tickets (id, tenant_id, user_id, subject, description, status, priority)
            VALUES (?, ?, ?, ?, ?, 'open', ?)
        ");
        $stmt->execute([$ticketId, $tenantId, $userId, $subject, $description, $priority]);

        sendResponse(["status" => "success", "id" => $ticketId]);
    }
}

sendResponse(["status" => "error", "message" => "Action non reconnue"], 404);
?>

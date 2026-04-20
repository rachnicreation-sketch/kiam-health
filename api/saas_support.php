<?php
require_once 'config.php';
require_once 'functions.php';

/**
 * Backend pour la gestion des tickets de support SaaS
 */

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->query("
            SELECT t.*, tn.name as tenant_name 
            FROM kiam_support_tickets t 
            JOIN kiam_tenants tn ON t.tenant_id = tn.id 
            ORDER BY t.created_at DESC
        ");
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    
    if ($action === 'update_status') {
        $stmt = $pdo->prepare("UPDATE kiam_support_tickets SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $data['id']]);
        sendResponse(["status" => "success"]);
    }
}
?>

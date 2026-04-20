<?php
require_once 'config.php';
require_once 'functions.php';

/**
 * Gestion des notifications multi-secteurs
 */

$method = $_SERVER['REQUEST_METHOD'];
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

if ($method === 'POST') {
    $data = getRequestData();
    $action = $_GET['action'] ?? '';

    if ($action === 'mark_read') {
        if (!$clinicId) sendResponse(["status" => "error", "message" => "Clinic ID manquant"], 400);
        
        $stmt = $pdo->prepare("UPDATE kiam_tenants SET last_notifications_read_at = NOW() WHERE id = ?");
        $stmt->execute([$clinicId]);
        sendResponse(["status" => "success"]);
    }

    if (!isset($data['title']) || !isset($data['message'])) {
        sendResponse(["status" => "error", "message" => "Données incomplètes"], 400);
    }
    
    $id = 'sys-' . time();
    $target = $data['target_audience'] ?? 'all';
    $type = $data['type'] ?? 'system';
    
    $stmt = $pdo->prepare("INSERT INTO kiam_system_announcements (title, content, target_sector) VALUES (?, ?, ?)");
    if ($stmt->execute([$data['title'], $data['message'], $target])) {
        sendResponse(["status" => "success", "message" => "Notification diffusée avec succès"]);
    } else {
        sendResponse(["status" => "error", "message" => "Erreur DB"], 500);
    }
}

if ($method === 'GET') {
    if (!$clinicId) {
        sendResponse(["status" => "error", "message" => "Clinic ID manquant"], 400);
    }

    $notifications = [];

    // 0. SaaS Admin Global Notifications (from kiam_system_announcements)
    $stmt = $pdo->prepare("SELECT sn.* FROM kiam_system_announcements sn 
                           JOIN kiam_tenants c ON c.id = ?
                           WHERE (sn.target_sector = 'all' OR sn.target_sector = c.sector) 
                           AND (c.last_notifications_read_at IS NULL OR sn.created_at > c.last_notifications_read_at)
                           ORDER BY sn.created_at DESC LIMIT 5");
    $stmt->execute([$clinicId]);
    $sysNotifs = $stmt->fetchAll();
    foreach ($sysNotifs as $sys) {
        $notifications[] = [
            "id" => "ann-" . $sys['id'],
            "title" => $sys['title'],
            "message" => $sys['content'],
            "type" => "system",
            "priority" => "medium",
            "time" => date('d/m/Y H:i', strtotime($sys['created_at']))
        ];
    }

    // 1. Low stock medications (if health sector)
    $stmt = $pdo->prepare("SELECT role FROM kiam_global_users WHERE tenant_id = ? LIMIT 1"); // Fallback check or assumption
    // Actually, we check if the table exists
    try {
        $stmt = $pdo->prepare("SELECT * FROM medications WHERE clinic_id = ? AND stock < 10");
        $stmt->execute([$clinicId]);
        $lowStock = $stmt->fetchAll();
        foreach ($lowStock as $med) {
            $notifications[] = [
                "id" => "stock-" . $med['id'],
                "title" => "Stock Faible",
                "message" => "Le stock de " . $med['name'] . " est critique (" . $med['stock'] . ")",
                "type" => "inventory",
                "priority" => "high",
                "time" => "Maintenant"
            ];
        }
    } catch (Exception $e) {}

    // 2. Pending Lab Tests
    try {
        $stmt = $pdo->prepare("SELECT lt.*, p.name as patient_name FROM lab_tests lt JOIN patients p ON lt.patient_id = p.id WHERE lt.clinic_id = ? AND lt.status = 'pending'");
        $stmt->execute([$clinicId]);
        $pendingLabs = $stmt->fetchAll();
        foreach ($pendingLabs as $lab) {
            $notifications[] = [
                "id" => "lab-" . $lab['id'],
                "title" => "Analyse en attente",
                "message" => "Nouvelle analyse pour " . $lab['patient_name'],
                "type" => "lab",
                "priority" => "medium",
                "time" => "Aujourd'hui"
            ];
        }
    } catch (Exception $e) {}

    sendResponse($notifications);
}
?>


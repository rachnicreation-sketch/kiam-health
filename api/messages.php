<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

if (!$clinicId) {
    sendResponse(["status" => "error", "message" => "Clinic ID manquant"], 400);
}

if ($method === 'GET') {
    if ($action === 'list_users') {
        // Liste des collègues de la même clinique
        $stmt = $pdo->prepare("SELECT id, name, role, email FROM users WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'chat') {
        $user1 = $_GET['user1'];
        $user2 = $_GET['user2'];
        
        $stmt = $pdo->prepare("SELECT * FROM internal_messages 
                               WHERE clinic_id = ? 
                               AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
                               ORDER BY created_at ASC");
        $stmt->execute([$clinicId, $user1, $user2, $user2, $user1]);
        
        // Mark as read when opening chat
        $update = $pdo->prepare("UPDATE internal_messages SET is_read = 1 
                                 WHERE clinic_id = ? AND receiver_id = ? AND sender_id = ?");
        $update->execute([$clinicId, $user1, $user2]);
        
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'unread_count') {
        $userId = $_GET['userId'];
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM internal_messages WHERE receiver_id = ? AND is_read = 0");
        $stmt->execute([$userId]);
        sendResponse($stmt->fetch());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!isset($data['sender_id']) || !isset($data['receiver_id']) || !isset($data['content'])) {
        sendResponse(["status" => "error", "message" => "Données incomplètes"], 400);
    }
    
    $stmt = $pdo->prepare("INSERT INTO internal_messages (clinic_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)");
    if ($stmt->execute([$clinicId, $data['sender_id'], $data['receiver_id'], $data['content']])) {
        sendResponse(["status" => "success"]);
    } else {
        sendResponse(["status" => "error", "message" => "Erreur DB"], 500);
    }
}
?>


<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    // Liste des utilisateurs par clinique
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT id, email, role, name, specialty, phone FROM users WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'profile' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        sendResponse($stmt->fetch());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    
    if ($action === 'add_document') {
        $id = "DOC-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO user_docs (id, tenant_id, user_id, type, name, file_url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['user_id'], $data['type'], $data['name'], $data['file_url']]);
        sendResponse(["status" => "success", "id" => $id]);
    } else {
        if (!$data['email'] || !$data['password'] || !$data['role']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }

        $id = "u" . time();
        $stmt = $pdo->prepare("INSERT INTO users (id, email, password_hash, role, clinic_id, name) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $data['email'],
            $data['password'], // Utiliser password_hash en prod
            $data['role'],
            $clinicId,
            $data['name'] ?? 'Utilisateur'
        ]);

        sendResponse(["status" => "success", "id" => $id]);
    }
} elseif ($method === 'GET' && $action === 'list_documents') {
    $userId = $_GET['user_id'];
    $stmt = $pdo->prepare("SELECT * FROM user_docs WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$clinicId, $userId]);
    sendResponse($stmt->fetchAll());
} elseif ($method === 'PUT') {
    $data = getRequestData();
    if (!$data['id']) {
        sendResponse(["status" => "error", "message" => "ID manquant"], 400);
    }

    $stmt = $pdo->prepare("UPDATE users SET name = ?, specialty = ?, phone = ? WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['specialty'] ?? '',
        $data['phone'] ?? '',
        $data['id']
    ]);

    sendResponse(["status" => "success"]);
}
?>

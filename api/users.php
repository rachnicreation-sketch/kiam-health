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

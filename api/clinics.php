<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->query("SELECT * FROM clinics ORDER BY name ASC");
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'get' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM clinics WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        sendResponse($stmt->fetch());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['name']) {
        sendResponse(["status" => "error", "message" => "Nom de la clinique requis"], 400);
    }

    $id = $data['id'] ?: "CL-" . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
    
    $stmt = $pdo->prepare("INSERT INTO clinics (id, name, status, email, phone, address, website, tax_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $data['name'],
        $data['status'] ?? 'active',
        $data['email'] ?? '',
        $data['phone'] ?? '',
        $data['address'] ?? '',
        $data['website'] ?? '',
        $data['taxId'] ?? ''
    ]);

    sendResponse(["status" => "success", "id" => $id]);
} elseif ($method === 'PUT') {
    $data = getRequestData();
    if (!$data['id']) {
        sendResponse(["status" => "error", "message" => "ID de la clinique requis"], 400);
    }

    if (isset($data['status'])) {
        $stmt = $pdo->prepare("UPDATE clinics SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $data['id']]);
        sendResponse(["status" => "success"]);
    }
}
?>

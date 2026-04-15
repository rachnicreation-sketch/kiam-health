<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM branches WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['name'] || !$data['clinicId']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $id = "BR-" . time();
    $stmt = $pdo->prepare("INSERT INTO branches (id, clinic_id, name, type, address, phone, manager, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $data['clinicId'],
        $data['name'],
        $data['type'] ?? 'branch',
        $data['address'] ?? '',
        $data['phone'] ?? '',
        $data['manager'] ?? '',
        $data['status'] ?? 'open'
    ]);

    sendResponse(["status" => "success", "id" => $id]);
} elseif ($method === 'PUT') {
    $data = getRequestData();
    if (!$data['id']) {
        sendResponse(["status" => "error", "message" => "ID manquant"], 400);
    }

    $stmt = $pdo->prepare("UPDATE branches SET name = ?, type = ?, address = ?, phone = ?, manager = ?, status = ? WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['type'],
        $data['address'],
        $data['phone'],
        $data['manager'],
        $data['status'],
        $data['id']
    ]);

    sendResponse(["status" => "success"]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        sendResponse(["status" => "error", "message" => "ID manquant"], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM branches WHERE id = ?");
    $stmt->execute([$id]);

    sendResponse(["status" => "success"]);
}
?>

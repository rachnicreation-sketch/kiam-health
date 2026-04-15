<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM beds WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['clinicId'] || !$data['ward'] || !$data['room'] || !$data['bedNum']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $id = "B-" . time();
    $stmt = $pdo->prepare("INSERT INTO beds (id, clinic_id, ward, room, bed_num, status) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $data['clinicId'],
        $data['ward'],
        $data['room'],
        $data['bedNum'],
        $data['status'] ?? 'available'
    ]);

    sendResponse(["status" => "success", "id" => $id]);
} elseif ($method === 'PUT') {
    $data = getRequestData();
    if (!$data['id']) {
        sendResponse(["status" => "error", "message" => "ID manquant"], 400);
    }

    $stmt = $pdo->prepare("UPDATE beds SET status = ? WHERE id = ?");
    $stmt->execute([$data['status'], $data['id']]);

    sendResponse(["status" => "success"]);
}
?>

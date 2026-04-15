<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM patients WHERE clinic_id = ? ORDER BY name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'get' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM patients WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        sendResponse($stmt->fetch());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['name'] || !$data['clinicId']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $id = $data['id'] ?: "PT-" . date("Y") . "-" . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
    
    $stmt = $pdo->prepare("INSERT INTO patients (id, clinic_id, name, first_name, age, gender, phone, address, blood_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $data['clinicId'],
        $data['name'],
        $data['firstName'] ?? '',
        $data['age'] ?? null,
        $data['gender'] ?? 'M',
        $data['phone'] ?? '',
        $data['address'] ?? '',
        $data['bloodGroup'] ?? ''
    ]);

    sendResponse(["status" => "success", "id" => $id]);
}
?>

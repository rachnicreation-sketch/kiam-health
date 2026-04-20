<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM medications WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['name'] || !$data['clinicId']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $id = "M-" . time();
    $stmt = $pdo->prepare("INSERT INTO medications (id, clinic_id, name, category, stock, unit, threshold, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $data['clinicId'],
        $data['name'],
        $data['category'] ?? '',
        $data['stock'] ?? 0,
        $data['unit'] ?? 'unité',
        $data['threshold'] ?? 5,
        $data['price'] ?? 0
    ]);

    sendResponse(["status" => "success", "id" => $id]);
} elseif ($method === 'PUT') {
    $data = getRequestData();
    if (!$data['id']) {
        sendResponse(["status" => "error", "message" => "ID manquant"], 400);
    }

    // Gestion de la mise à jour de stock ou des infos
    if (isset($data['stock_adjustment'])) {
        $stmt = $pdo->prepare("UPDATE medications SET stock = stock + ? WHERE id = ?");
        $stmt->execute([$data['stock_adjustment'], $data['id']]);
    } else {
        $stmt = $pdo->prepare("UPDATE medications SET name = ?, category = ?, stock = ?, unit = ?, threshold = ?, price = ? WHERE id = ?");
        $stmt->execute([
            $data['name'],
            $data['category'],
            $data['stock'],
            $data['unit'],
            $data['threshold'],
            $data['price'],
            $data['id']
        ]);
    }

    sendResponse(["status" => "success"]);
}
?>


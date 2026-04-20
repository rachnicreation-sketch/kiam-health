<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE clinic_id = ? ORDER BY name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'stats') {
        $stats = [
            "total_items" => $pdo->query("SELECT COUNT(*) FROM inventory_items WHERE clinic_id = '$clinicId'")->fetchColumn(),
            "low_stock" => $pdo->query("SELECT COUNT(*) FROM inventory_items WHERE clinic_id = '$clinicId' AND stock <= threshold")->fetchColumn(),
            "out_of_stock" => $pdo->query("SELECT COUNT(*) FROM inventory_items WHERE clinic_id = '$clinicId' AND stock <= 0")->fetchColumn()
        ];
        sendResponse($stats);
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    
    if ($action === 'add') {
        if (!$data['name'] || !isset($data['stock'])) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }
        $id = "PRD-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO inventory_items (id, clinic_id, name, category, sku, stock, unit, price_buy, price_sell, threshold, warehouse) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id, $clinicId, $data['name'], $data['category'] ?? 'Général', $data['sku'] ?? 'SKU-'.time(),
            $data['stock'], $data['unit'] ?? 'unité', $data['price_buy'] ?? 0, $data['price_sell'] ?? 0,
            $data['threshold'] ?? 5, $data['warehouse'] ?? 'Main'
        ]);
        sendResponse(["status" => "success", "id" => $id]);
    }
} elseif ($method === 'PUT') {
    $data = getRequestData();
    if ($action === 'stock_adj') {
        if (!$data['id'] || !isset($data['adjustment'])) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }
        $stmt = $pdo->prepare("UPDATE inventory_items SET stock = stock + ? WHERE id = ? AND clinic_id = ?");
        $stmt->execute([$data['adjustment'], $data['id'], $clinicId]);
        sendResponse(["status" => "success"]);
    }
}
?>

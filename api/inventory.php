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
    } elseif ($action === 'list_movements') {
        $stmt = $pdo->prepare("SELECT m.*, i.name as item_name FROM inventory_movements m JOIN inventory_items i ON m.item_id = i.id WHERE m.clinic_id = ? ORDER BY m.created_at DESC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'stats') {
        $stats = [
            "total_items" => $pdo->query("SELECT COUNT(*) FROM inventory_items WHERE clinic_id = '$clinicId'")->fetchColumn(),
            "low_stock" => $pdo->query("SELECT COUNT(*) FROM inventory_items WHERE clinic_id = '$clinicId' AND stock <= threshold")->fetchColumn(),
            "out_of_stock" => $pdo->query("SELECT COUNT(*) FROM inventory_items WHERE clinic_id = '$clinicId' AND stock <= 0")->fetchColumn(),
            "top_items" => $pdo->query("SELECT name, stock, unit, price_sell FROM inventory_items WHERE clinic_id = '$clinicId' ORDER BY stock DESC LIMIT 5")->fetchAll(),
            "distribution" => $pdo->query("SELECT category, COUNT(*) as count FROM inventory_items WHERE clinic_id = '$clinicId' GROUP BY category")->fetchAll()
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
    } elseif ($action === 'update') {
        if (!$data['id'] || !$data['name']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }
        $stmt = $pdo->prepare("UPDATE inventory_items SET name = ?, category = ?, sku = ?, unit = ?, price_buy = ?, price_sell = ?, threshold = ? WHERE id = ? AND clinic_id = ?");
        $stmt->execute([
            $data['name'], $data['category'], $data['sku'], $data['unit'], 
            $data['price_buy'], $data['price_sell'], $data['threshold'],
            $data['id'], $clinicId
        ]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'delete') {
        if (!$data['id']) {
            sendResponse(["status" => "error", "message" => "ID manquant"], 400);
        }
        $stmt = $pdo->prepare("DELETE FROM inventory_items WHERE id = ? AND clinic_id = ?");
        $stmt->execute([$data['id'], $clinicId]);
        sendResponse(["status" => "success"]);
    }
} elseif ($method === 'PUT') {
    $data = getRequestData();
    if ($action === 'stock_adj') {
        if (!$data['id'] || !isset($data['adjustment'])) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("UPDATE inventory_items SET stock = stock + ? WHERE id = ? AND clinic_id = ?");
        $stmt->execute([$data['adjustment'], $data['id'], $clinicId]);
        
        $mId = "MOV-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO inventory_movements (id, clinic_id, item_id, type, quantity, reason, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $mId, $clinicId, $data['id'], 
            $data['adjustment'] > 0 ? 'in' : 'out', 
            abs($data['adjustment']), 
            $data['reason'] ?? 'Ajustement manuel',
            $auth['id']
        ]);
        
        logActivity($pdo, $clinicId, $auth['id'], "Ajustement Stock", ["id" => $data['id'], "adj" => $data['adjustment']]);
        
        $pdo->commit();
        sendResponse(["status" => "success"]);
    }
}
?>

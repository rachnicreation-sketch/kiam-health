<?php
require_once 'config.php';
require_once 'functions.php';

$data = getRequestData();
$action = $_GET['action'] ?? '';
$tenant_id = $_GET['clinicId'] ?? ($data['clinicId'] ?? null);

if (!$tenant_id) {
    sendResponse(["status" => "error", "message" => "Tenant ID requis"], 400);
}

if ($action === 'stats') {
    // Basic stats for ERP
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_items, SUM(stock) as total_stock FROM inventory_items WHERE clinic_id = ?");
    $stmt->execute([$tenant_id]);
    $inv = $stmt->fetch();

    $stmt = $pdo->prepare("SELECT COUNT(*) as low_stock FROM inventory_items WHERE clinic_id = ? AND stock <= threshold AND stock > 0");
    $stmt->execute([$tenant_id]);
    $low = $stmt->fetch();

    $stmt = $pdo->prepare("SELECT COUNT(*) as out_of_stock FROM inventory_items WHERE clinic_id = ? AND stock <= 0");
    $stmt->execute([$tenant_id]);
    $out = $stmt->fetch();

    // Sales stats (Simulated for now or from transactions)
    $stmt = $pdo->prepare("SELECT SUM(amount) as revenue FROM transactions WHERE clinic_id = ? AND type = 'income' AND category = 'sale' AND DATE(created_at) = CURDATE()");
    $stmt->execute([$tenant_id]);
    $today_sales = $stmt->fetch();

    // Distribution by category
    $stmt = $pdo->prepare("SELECT category, COUNT(*) as count FROM inventory_items WHERE clinic_id = ? GROUP BY category");
    $stmt->execute([$tenant_id]);
    $distribution = $stmt->fetchAll();

    sendResponse([
        "status" => "success",
        "total_items" => $inv['total_items'] ?? 0,
        "total_stock" => $inv['total_stock'] ?? 0,
        "low_stock" => $low['low_stock'] ?? 0,
        "out_of_stock" => $out['out_of_stock'] ?? 0,
        "today_revenue" => $today_sales['revenue'] ?? 0,
        "distribution" => $distribution
    ]);

} elseif ($action === 'pos_sale') {
    // Process a POS sale
    $items = $data['items'] ?? []; // [{id, quantity, price}]
    $total = $data['total'] ?? 0;
    $payment_method = $data['payment_method'] ?? 'cash';

    if (empty($items)) {
        sendResponse(["status" => "error", "message" => "Panier vide"], 400);
    }

    try {
        $pdo->beginTransaction();

        // 1. Create Transaction record
        $stmt = $pdo->prepare("INSERT INTO transactions (clinic_id, amount, type, category, description, payment_method) VALUES (?, ?, 'income', 'sale', 'Vente POS', ?)");
        $stmt->execute([$tenant_id, $total, $payment_method]);
        $transaction_id = $pdo->lastInsertId();

        // 2. Adjust Stock for each item
        foreach ($items as $item) {
            $stmt = $pdo->prepare("UPDATE inventory_items SET stock = stock - ? WHERE id = ? AND clinic_id = ?");
            $stmt->execute([$item['quantity'], $item['id'], $tenant_id]);
        }

        $pdo->commit();
        sendResponse(["status" => "success", "message" => "Vente réussie", "transaction_id" => $transaction_id]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => "Erreur transaction: " . $e->getMessage()], 500);
    }

} elseif ($action === 'list_sales') {
    $stmt = $pdo->prepare("SELECT * FROM transactions WHERE clinic_id = ? AND category = 'sale' ORDER BY created_at DESC LIMIT 50");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} else {
    sendResponse(["status" => "error", "message" => "Action non reconnue"], 404);
}
?>

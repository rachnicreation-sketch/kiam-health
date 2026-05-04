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

    // Sales stats
    $stmt = $pdo->prepare("SELECT SUM(amount) as revenue FROM transactions WHERE clinic_id = ? AND type = 'income' AND category = 'sale' AND DATE(created_at) = CURDATE()");
    $stmt->execute([$tenant_id]);
    $today_sales = $stmt->fetch();

    // Expenses stats
    $stmt = $pdo->prepare("SELECT SUM(amount) as total_expenses FROM erp_expenses WHERE clinic_id = ? AND DATE(date) = CURDATE()");
    $stmt->execute([$tenant_id]);
    $today_expenses = $stmt->fetch();

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
        "today_expenses" => $today_expenses['total_expenses'] ?? 0,
        "distribution" => $distribution
    ]);

} elseif ($action === 'pos_sale') {
    $items = $data['items'] ?? []; 
    $total = $data['total'] ?? 0;
    $payment_method = $data['payment_method'] ?? 'cash';
    $customer_id = $data['customer_id'] ?? null;
    $discount = $data['discount'] ?? 0;

    if (empty($items)) {
        sendResponse(["status" => "error", "message" => "Panier vide"], 400);
    }

    try {
        $pdo->beginTransaction();

        // 1. Create Transaction record
        $stmt = $pdo->prepare("INSERT INTO transactions (clinic_id, customer_id, amount, type, category, description, payment_method) VALUES (?, ?, ?, 'income', 'sale', 'Vente POS', ?)");
        $stmt->execute([$tenant_id, $customer_id, $total, $payment_method]);
        $transaction_id = $pdo->lastInsertId();

        // 2. Adjust Stock and update inventory
        foreach ($items as $item) {
            $stmt = $pdo->prepare("UPDATE inventory_items SET stock = stock - ? WHERE id = ? AND clinic_id = ?");
            $stmt->execute([$item['quantity'], $item['id'], $tenant_id]);
        }

        // 3. Update customer loyalty if applicable
        if ($customer_id) {
            $points = floor($total / 1000); // 1 point per 1000 CFA
            $stmt = $pdo->prepare("UPDATE erp_customers SET loyalty_points = loyalty_points + ? WHERE id = ? AND clinic_id = ?");
            $stmt->execute([$points, $customer_id, $tenant_id]);
        }

        $pdo->commit();
        sendResponse(["status" => "success", "message" => "Vente réussie", "transaction_id" => $transaction_id]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => "Erreur transaction: " . $e->getMessage()], 500);
    }

} elseif ($action === 'list_sales') {
    $stmt = $pdo->prepare("SELECT t.*, c.name as customer_name FROM transactions t LEFT JOIN erp_customers c ON t.customer_id = c.id WHERE t.clinic_id = ? AND t.category = 'sale' ORDER BY t.created_at DESC LIMIT 100");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'list_customers') {
    $stmt = $pdo->prepare("SELECT * FROM erp_customers WHERE clinic_id = ? ORDER BY name ASC");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'add_customer') {
    $id = "CUST-" . time();
    $stmt = $pdo->prepare("INSERT INTO erp_customers (id, clinic_id, name, phone, email) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$id, $tenant_id, $data['name'], $data['phone'] ?? null, $data['email'] ?? null]);
    sendResponse(["status" => "success", "id" => $id]);

} elseif ($action === 'list_suppliers') {
    $stmt = $pdo->prepare("SELECT * FROM erp_suppliers WHERE clinic_id = ? ORDER BY name ASC");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'add_supplier') {
    $id = "SUPP-" . time();
    $stmt = $pdo->prepare("INSERT INTO erp_suppliers (id, clinic_id, name, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $tenant_id, $data['name'], $data['phone'] ?? null, $data['email'] ?? null, $data['address'] ?? null]);
    sendResponse(["status" => "success", "id" => $id]);

} elseif ($action === 'list_expenses') {
    $stmt = $pdo->prepare("SELECT * FROM erp_expenses WHERE clinic_id = ? ORDER BY date DESC LIMIT 100");
    $stmt->execute([$tenant_id]);
    sendResponse($stmt->fetchAll());

} elseif ($action === 'add_expense') {
    $id = "EXP-" . time();
    $stmt = $pdo->prepare("INSERT INTO erp_expenses (id, clinic_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $tenant_id, $data['amount'], $data['category'], $data['description'] ?? null, $data['date'] ?? date('Y-m-d')]);
    sendResponse(["status" => "success", "id" => $id]);

} else {
    sendResponse(["status" => "error", "message" => "Action non reconnue"], 404);
}
?>

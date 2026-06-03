<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$clinicId = $auth['clinic_id'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list_medications';

// Auto-table creation for Pharmacy if they don't exist
try {
    $pdo->query("CREATE TABLE IF NOT EXISTS pharmacy_inventory (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        stock_quantity INT DEFAULT 0,
        min_stock INT DEFAULT 5,
        price_buy DECIMAL(10,2),
        price_sell DECIMAL(10,2),
        expiry_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->query("CREATE TABLE IF NOT EXISTS pharmacy_sales (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        total_amount DECIMAL(10,2),
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {}

if ($method === 'GET') {
    if ($action === 'list_medications') {
        $stmt = $pdo->prepare("SELECT * FROM pharmacy_inventory WHERE clinic_id = ? ORDER BY name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());

    } elseif ($action === 'stats') {
        $stats = [
            "total_items" => $pdo->query("SELECT COUNT(*) FROM pharmacy_inventory WHERE clinic_id = '$clinicId'")->fetchColumn(),
            "low_stock" => $pdo->query("SELECT COUNT(*) FROM pharmacy_inventory WHERE clinic_id = '$clinicId' AND stock_quantity <= min_stock")->fetchColumn(),
            "expired" => $pdo->query("SELECT COUNT(*) FROM pharmacy_inventory WHERE clinic_id = '$clinicId' AND expiry_date < CURDATE()")->fetchColumn(),
            "sales_today" => $pdo->query("SELECT COALESCE(SUM(total_amount), 0) FROM pharmacy_sales WHERE clinic_id = '$clinicId' AND DATE(created_at) = CURDATE()")->fetchColumn(),
        ];
        sendResponse($stats);
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if ($action === 'add_medication') {
        $id = "MED-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO pharmacy_inventory (id, clinic_id, name, category, stock_quantity, min_stock, price_buy, price_sell, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id, $clinicId, $data['name'], $data['category'], $data['stock_quantity'], 
            $data['min_stock'], $data['price_buy'], $data['price_sell'], $data['expiry_date']
        ]);
        sendResponse(["status" => "success", "id" => $id]);
    }
}
?>

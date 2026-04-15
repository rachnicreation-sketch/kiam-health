<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM transactions WHERE clinic_id = ? ORDER BY transaction_date DESC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['clinicId'] || !$data['amount']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $id = "TR-" . time();
    $date = $data['date'] ?? date("Y-m-d");

    $stmt = $pdo->prepare("INSERT INTO transactions (id, clinic_id, type, amount, category, transaction_date, description, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $data['clinicId'],
        $data['type'] ?? 'income',
        $data['amount'],
        $data['category'] ?? 'Général',
        $date,
        $data['description'] ?? '',
        $data['paymentMethod'] ?? 'cash'
    ]);

    sendResponse(["status" => "success", "id" => $id]);
}
?>

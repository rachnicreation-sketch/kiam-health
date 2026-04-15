<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT s.*, m.name as med_name, p.name as patient_name, p.first_name as patient_first_name 
                               FROM pharmacy_sales s
                               JOIN medications m ON s.medication_id = m.id
                               JOIN patients p ON s.patient_id = p.id
                               WHERE s.clinic_id = ?
                               ORDER BY s.sale_date DESC");
        $stmt->execute([$clinicId]);
        $sales = $stmt->fetchAll();
        
        $formatted = [];
        foreach($sales as $s) {
            $formatted[] = [
                "id" => $s['id'],
                "clinicId" => $s['clinic_id'],
                "patientId" => $s['patient_id'],
                "medName" => $s['med_name'],
                "quantity" => $s['quantity'],
                "totalPrice" => $s['total_price'],
                "date" => $s['sale_date'],
                "author" => $s['author']
            ];
        }
        sendResponse($formatted);
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['patientId'] || !$data['medicationId'] || !$data['quantity']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $id = "SALE-" . time();
    $stmt = $pdo->prepare("INSERT INTO pharmacy_sales (id, clinic_id, patient_id, medication_id, quantity, total_price, author) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $data['clinicId'],
        $data['patientId'],
        $data['medicationId'],
        $data['quantity'],
        $data['totalPrice'],
        $data['author'] ?? 'Système'
    ]);

    sendResponse(["status" => "success", "id" => $id]);
}
?>

<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM lab_tests WHERE clinic_id = ? ORDER BY test_date DESC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['patientId'] || !$data['testName']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $id = "LAB-" . time() . "-" . str_pad(rand(0, 99), 2, '0', STR_PAD_LEFT);
    
    $stmt = $pdo->prepare("INSERT INTO lab_tests (id, clinic_id, patient_id, doctor_id, test_name, category, status, normative_value, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $data['clinicId'],
        $data['patientId'],
        $data['doctorId'] ?? '',
        $data['testName'],
        $data['category'] ?? '',
        $data['status'] ?? 'pending',
        $data['normativeValue'] ?? '',
        $data['unit'] ?? ''
    ]);

    sendResponse(["status" => "success", "id" => $id]);
} elseif ($method === 'PUT') {
    $data = getRequestData();
    if (!$data['id'] || !$data['result']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $stmt = $pdo->prepare("UPDATE lab_tests SET result = ?, unit = ?, normative_value = ?, status = 'completed' WHERE id = ?");
    $stmt->execute([
        $data['result'],
        $data['unit'] ?? '',
        $data['normativeValue'] ?? '',
        $data['id']
    ]);

    sendResponse(["status" => "success"]);
}
?>


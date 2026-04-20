<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $patientId = $_GET['patientId'] ?? null;
        if ($patientId) {
            $stmt = $pdo->prepare("SELECT * FROM consultations WHERE clinic_id = ? AND patient_id = ? ORDER BY consultation_date DESC");
            $stmt->execute([$clinicId, $patientId]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM consultations WHERE clinic_id = ? ORDER BY consultation_date DESC");
            $stmt->execute([$clinicId]);
        }
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'get' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM consultations WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        sendResponse($stmt->fetch());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['patientId'] || !$data['clinicId']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $id = $data['id'] ?: "CONS-" . date("Ymd") . "-" . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
    
    $stmt = $pdo->prepare("INSERT INTO consultations (id, clinic_id, patient_id, doctor_id, reason, symptoms, temp, bp, weight, hr, diagnosis, prescription, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $data['clinicId'],
        $data['patientId'],
        $data['doctorId'] ?? '',
        $data['reason'] ?? '',
        $data['symptoms'] ?? '',
        $data['temp'] ?? '',
        $data['bp'] ?? '',
        $data['weight'] ?? '',
        $data['hr'] ?? '',
        $data['diagnosis'] ?? '',
        $data['prescription'] ?? '',
        $data['notes'] ?? '',
        $data['status'] ?? 'completed'
    ]);

    sendResponse(["status" => "success", "id" => $id]);
}
?>


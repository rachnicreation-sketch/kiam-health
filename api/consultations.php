<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = ensureClinicForTenant($pdo, $auth['tenant_id'] ?? null);

function mapConsultation(array $c): array {
    return [
        "id" => $c['id'],
        "clinicId" => $c['clinic_id'],
        "patientId" => $c['patient_id'],
        "doctorId" => $c['doctor_id'],
        "reason" => $c['reason'],
        "symptoms" => $c['symptoms'],
        "temp" => $c['temp'],
        "bp" => $c['bp'],
        "weight" => $c['weight'],
        "hr" => $c['hr'],
        "diagnosis" => $c['diagnosis'],
        "prescription" => $c['prescription'],
        "notes" => $c['notes'],
        "status" => $c['status'],
        "consultationDate" => $c['consultation_date'],
        "createdAt" => $c['created_at']
    ];
}

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
        sendResponse(array_map('mapConsultation', $stmt->fetchAll()));
    } elseif ($action === 'get' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM consultations WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) sendResponse(['status' => 'error', 'message' => 'Consultation introuvable'], 404);
        sendResponse(mapConsultation($row));
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (empty($data['patientId'])) {
        sendResponse(["status" => "error", "message" => "Données manquantes (patientId)"], 400);
    }

    $id = empty($data['id']) ? "CONS-" . date("Ymd") . "-" . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT) : $data['id'];
    
    $stmt = $pdo->prepare("INSERT INTO consultations (id, clinic_id, patient_id, doctor_id, reason, symptoms, temp, bp, weight, hr, diagnosis, prescription, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $clinicId,
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


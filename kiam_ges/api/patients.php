<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = ensureClinicForTenant($pdo, $auth['tenant_id'] ?? null);

if ($method === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT * FROM patients WHERE clinic_id = ? ORDER BY name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'get' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM patients WHERE id = ? AND clinic_id = ?");
        $stmt->execute([$_GET['id'], $clinicId]);
        sendResponse($stmt->fetch());
    }
} elseif ($method === 'POST') {
    $data = getRequestData() ?: [];
    if (empty($data['name'])) {
        sendResponse(["status" => "error", "message" => "Donnees manquantes: nom requis"], 400);
    }

    $id = $data['id'] ?? ("PT-" . date("Y") . "-" . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT));

    $stmt = $pdo->prepare("
        INSERT INTO patients (
            id, clinic_id, name, first_name, age, dob, gender, phone, address, city,
            id_number, blood_group, assurance, emergency_name, emergency_phone, allergies, medical_history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $id,
        $clinicId,
        $data['name'],
        $data['firstName'] ?? '',
        $data['age'] ?? null,
        !empty($data['dob']) ? $data['dob'] : null,
        $data['gender'] ?? 'M',
        $data['phone'] ?? '',
        $data['address'] ?? '',
        $data['city'] ?? '',
        $data['idNumber'] ?? '',
        $data['bloodGroup'] ?? '',
        $data['assurance'] ?? '',
        $data['emergencyContactName'] ?? '',
        $data['emergencyContactPhone'] ?? '',
        $data['allergies'] ?? '',
        $data['history'] ?? ''
    ]);

    sendResponse(["status" => "success", "id" => $id]);
}
?>

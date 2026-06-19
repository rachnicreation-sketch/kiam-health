<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = ensureClinicForTenant($pdo, $auth['tenant_id'] ?? null);

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM medical_acts WHERE clinic_id = ? ORDER BY name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    $id = $data['id'] ?? ("ACT-" . time() . rand(10, 99));
    
    $stmt = $pdo->prepare("INSERT INTO medical_acts (id, clinic_id, name, type, price, code, description) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $clinicId,
        $data['name'] ?? '',
        $data['type'] ?? 'consultation',
        (float)($data['price'] ?? 0),
        $data['code'] ?? '',
        $data['description'] ?? ''
    ]);
    
    sendResponse(['status' => 'success', 'id' => $id]);
} elseif ($method === 'PUT') {
    $data = getRequestData();
    $id = $data['id'] ?? '';
    if (!$id) {
        sendResponse(['error' => 'Missing ID'], 400);
    }
    
    $stmt = $pdo->prepare("UPDATE medical_acts SET name = ?, type = ?, price = ?, code = ?, description = ? WHERE id = ? AND clinic_id = ?");
    $stmt->execute([
        $data['name'] ?? '',
        $data['type'] ?? 'consultation',
        (float)($data['price'] ?? 0),
        $data['code'] ?? '',
        $data['description'] ?? '',
        $id,
        $clinicId
    ]);
    
    sendResponse(['status' => 'success']);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) {
        sendResponse(['error' => 'Missing ID'], 400);
    }
    $stmt = $pdo->prepare("DELETE FROM medical_acts WHERE id = ? AND clinic_id = ?");
    $stmt->execute([$id, $clinicId]);
    sendResponse(['status' => 'success']);
}
?>


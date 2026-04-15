<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$clinicId = $_GET['clinicId'] ?? null;
$query = $_GET['query'] ?? '';

if ($method === 'GET') {
    if (!$clinicId || !$query) {
        sendResponse([]);
    }

    $results = [];
    $searchTerm = "%$query%";

    // 1. Search Patients
    $stmt = $pdo->prepare("SELECT id, name, 'patient' as type FROM patients WHERE clinic_id = ? AND (name LIKE ? OR id LIKE ?)");
    $stmt->execute([$clinicId, $searchTerm, $searchTerm]);
    while ($row = $stmt->fetch()) {
        $results[] = [
            "id" => $row['id'],
            "title" => $row['name'],
            "subtitle" => "Patient - " . $row['id'],
            "type" => "patient",
            "url" => "/patients/" . $row['id']
        ];
    }

    // 2. Search Users/Staff
    $stmt = $pdo->prepare("SELECT id, name, role, 'staff' as type FROM users WHERE clinic_id = ? AND (name LIKE ? OR email LIKE ?)");
    $stmt->execute([$clinicId, $searchTerm, $searchTerm]);
    while ($row = $stmt->fetch()) {
        $results[] = [
            "id" => $row['id'],
            "title" => $row['name'],
            "subtitle" => "Personnel - " . ucfirst($row['role']),
            "type" => "staff",
            "url" => "/hr"
        ];
    }

    // 3. Search Invoices
    $stmt = $pdo->prepare("SELECT id, patient_id, 'invoice' as type FROM invoices WHERE clinic_id = ? AND (id LIKE ? OR patient_id LIKE ?)");
    $stmt->execute([$clinicId, $searchTerm, $searchTerm]);
    while ($row = $stmt->fetch()) {
        $results[] = [
            "id" => $row['id'],
            "title" => "Facture " . $row['id'],
            "subtitle" => "Patient: " . $row['patient_id'],
            "type" => "invoice",
            "url" => "/billing"
        ];
    }

    sendResponse($results);
}
?>

<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

// Get sector from tenant table
$stmt = $pdo->prepare("SELECT sector FROM kiam_tenants WHERE id = ?");
$stmt->execute([$clinicId]);
$tenant = $stmt->fetch();
$sector = $tenant['sector'] ?? 'health';

$query = $_GET['query'] ?? '';

if ($method === 'GET') {
    if (!$clinicId || !$query) {
        sendResponse([]);
    }

    $results = [];
    $searchTerm = "%$query%";

    // 1. Sector-Specific Search
    if ($sector === 'health') {
        // Search Patients
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

        // Search Invoices
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
    } elseif ($sector === 'erp' || $sector === 'shop') {
        // Search Medications/Products
        $stmt = $pdo->prepare("SELECT id, name, stock, 'product' as type FROM medications WHERE clinic_id = ? AND (name LIKE ? OR id LIKE ?)");
        $stmt->execute([$clinicId, $searchTerm, $searchTerm]);
        while ($row = $stmt->fetch()) {
            $results[] = [
                "id" => $row['id'],
                "title" => $row['name'],
                "subtitle" => "Produit - Stock: " . $row['stock'],
                "type" => "product",
                "url" => "/erp/inventory"
            ];
        }

        // Search Customers (Patients table is used for customers too in some ERP setups here)
        $stmt = $pdo->prepare("SELECT id, name, 'customer' as type FROM patients WHERE clinic_id = ? AND (name LIKE ? OR id LIKE ?)");
        $stmt->execute([$clinicId, $searchTerm, $searchTerm]);
        while ($row = $stmt->fetch()) {
            $results[] = [
                "id" => $row['id'],
                "title" => $row['name'],
                "subtitle" => "Client - " . $row['id'],
                "type" => "customer",
                "url" => "/erp/customers"
            ];
        }
    } elseif ($sector === 'hotel') {
        // Search Rooms
        $stmt = $pdo->prepare("SELECT id, ward, room, 'room' as type FROM beds WHERE clinic_id = ? AND (room LIKE ? OR ward LIKE ?)");
        $stmt->execute([$clinicId, $searchTerm, $searchTerm]);
        while ($row = $stmt->fetch()) {
            $results[] = [
                "id" => $row['id'],
                "title" => "Chambre " . $row['room'],
                "subtitle" => "Bloc: " . $row['ward'],
                "type" => "room",
                "url" => "/hotel/rooms"
            ];
        }
    }

    // 2. Global Users (Staff) - common to all sectors
    $stmt = $pdo->prepare("SELECT id, name, role, 'staff' as type FROM users WHERE clinic_id = ? AND (name LIKE ? OR email LIKE ?)");
    $stmt->execute([$clinicId, $searchTerm, $searchTerm]);
    while ($row = $stmt->fetch()) {
        $results[] = [
            "id" => $row['id'],
            "title" => $row['name'],
            "subtitle" => "Personnel - " . ucfirst($row['role']),
            "type" => "staff",
            "url" => ($sector === 'health' ? "/hr" : ($sector === 'erp' ? "/erp/staff" : "/settings"))
        ];
    }

    sendResponse($results);
}
?>

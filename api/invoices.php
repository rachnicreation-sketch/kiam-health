<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM invoices WHERE clinic_id = ? ORDER BY invoice_date DESC");
        $stmt->execute([$clinicId]);
        $invoices = $stmt->fetchAll();
        
        // Fetch items for each invoice
        foreach ($invoices as &$invoice) {
            $itemStmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
            $itemStmt->execute([$invoice['id']]);
            $invoice['items'] = $itemStmt->fetchAll();
        }
        
        sendResponse($invoices);
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['patientId'] || !$data['clinicId'] || !$data['items']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $id = "INV-" . date("Ymd") . "-" . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
    $itemDate = $data['date'] ?? date("Y-m-d");

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO invoices (id, clinic_id, patient_id, invoice_date, total_amount, status, payment_method, insurance_company, insurance_coverage, amount_insurance, amount_patient) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $data['clinicId'],
            $data['patientId'],
            $itemDate,
            $data['total'] ?? 0,
            $data['status'] ?? 'pending',
            $data['paymentMethod'] ?? 'cash',
            $data['insuranceCompany'] ?? null,
            $data['insuranceCoverage'] ?? 0,
            $data['amountInsurance'] ?? 0,
            $data['amountPatient'] ?? $data['total']
        ]);

        $itemStmt = $pdo->prepare("INSERT INTO invoice_items (invoice_id, description, amount) VALUES (?, ?, ?)");
        foreach ($data['items'] as $item) {
            $itemStmt->execute([$id, $item['description'], $item['amount']]);
        }

        logActivity($pdo, $data['clinicId'], $auth['id'], "Émission Facture", ["id" => $id, "total" => $data['total']]);

        $pdo->commit();
        sendResponse(["status" => "success", "id" => $id]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["status" => "error", "message" => "Erreur lors de la création de la facture: " . $e->getMessage()], 500);
    }
}
?>


<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM employees WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        $rows = $stmt->fetchAll();
        $formatted = [];
        foreach ($rows as $e) {
            $formatted[] = [
                "id"         => $e['id'],
                "clinicId"   => $e['clinic_id'],
                "name"       => $e['name'],
                "firstName"  => $e['first_name'],
                "department" => $e['department'],
                "position"   => $e['position'],
                "baseSalary" => (float)$e['base_salary'],
                "hireDate"   => $e['hire_date'],
                "status"     => $e['status'],
                "cnssNumber" => $e['cnss_number'],
            ];
        }
        sendResponse($formatted);
    } elseif ($action === 'list_documents') {
        $empId = $_GET['employee_id'];
        $stmt = $pdo->prepare("SELECT * FROM user_docs WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$clinicId, $empId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    if ($action === 'add_document') {
        $data = getRequestData();
        $id = "DOC-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO user_docs (id, tenant_id, user_id, type, name, file_url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['employee_id'], $data['type'], $data['name'], $data['file_url']]);
        sendResponse(["status" => "success", "id" => $id]);
    } else {
        $data = getRequestData();
        if (!$data['name'] || !$data['clinicId']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }

        $id = "EMP-" . time();
        $stmt = $pdo->prepare("INSERT INTO employees (id, clinic_id, name, first_name, department, position, base_salary, hire_date, status, cnss_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $data['clinicId'],
            $data['name'],
            $data['firstName'] ?? '',
            $data['department'] ?? 'Général',
            $data['position'] ?? '',
            $data['baseSalary'] ?? 0,
            $data['hireDate'] ?? date('Y-m-d'),
            $data['status'] ?? 'active',
            $data['cnssNumber'] ?? null
        ]);

        sendResponse(["status" => "success", "id" => $id]);
    }
}
?>


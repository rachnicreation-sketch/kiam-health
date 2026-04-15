<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM employees WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
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
?>

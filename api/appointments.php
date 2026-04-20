<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$auth = requireAuth();
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT a.*, p.name as patient_name, u.name as doctor_name 
                               FROM appointments a 
                               LEFT JOIN patients p ON a.patient_id = p.id 
                               LEFT JOIN users u ON a.doctor_id = u.id 
                               WHERE a.clinic_id = ? 
                               ORDER BY a.appointment_date ASC, a.appointment_time ASC");
        $stmt->execute([$clinicId]);
        $apps = $stmt->fetchAll();
        
        // Formatter pour le frontend
        $formatted = [];
        foreach($apps as $app) {
            $formatted[] = [
                "id" => $app['id'],
                "clinicId" => $app['clinic_id'],
                "patientId" => $app['patient_id'],
                "doctorId" => $app['doctor_id'],
                "date" => $app['appointment_date'],
                "time" => substr($app['appointment_time'], 0, 5),
                "patient" => $app['patient_name'],
                "doctor" => $app['doctor_name'],
                "type" => $app['type'],
                "status" => $app['status']
            ];
        }
        sendResponse($formatted);
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if (!$data['patientId'] || !$data['doctorId'] || !$data['date'] || !$data['time']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $id = "APP-" . time();
    $stmt = $pdo->prepare("INSERT INTO appointments (id, clinic_id, patient_id, doctor_id, appointment_date, appointment_time, type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $data['clinicId'],
        $data['patientId'],
        $data['doctorId'],
        $data['date'],
        $data['time'],
        $data['type'] ?? 'Consultation',
        $data['status'] ?? 'pending'
    ]);

    sendResponse(["status" => "success", "id" => $id]);
} elseif ($method === 'PUT') {
    $data = getRequestData();
    if (!$data['id'] || !$data['status']) {
        sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
    }

    $stmt = $pdo->prepare("UPDATE appointments SET status = ? WHERE id = ?");
    $stmt->execute([$data['status'], $data['id']]);

    sendResponse(["status" => "success"]);
}
?>


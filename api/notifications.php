<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if (!$clinicId) {
        sendResponse(["status" => "error", "message" => "Clinic ID manquant"], 400);
    }

    $notifications = [];

    // 1. Low stock medications
    $stmt = $pdo->prepare("SELECT * FROM medications WHERE clinic_id = ? AND stock < 10");
    $stmt->execute([$clinicId]);
    $lowStock = $stmt->fetchAll();
    foreach ($lowStock as $med) {
        $notifications[] = [
            "id" => "stock-" . $med['id'],
            "title" => "Stock Faible",
            "message" => "Le stock de " . $med['name'] . " est critique (" . $med['stock'] . ")",
            "type" => "inventory",
            "priority" => "high",
            "time" => "Maintenant"
        ];
    }

    // 2. Pending Lab Tests
    $stmt = $pdo->prepare("SELECT lt.*, p.name as patient_name FROM lab_tests lt JOIN patients p ON lt.patient_id = p.id WHERE lt.clinic_id = ? AND lt.status = 'pending'");
    $stmt->execute([$clinicId]);
    $pendingLabs = $stmt->fetchAll();
    foreach ($pendingLabs as $lab) {
        $notifications[] = [
            "id" => "lab-" . $lab['id'],
            "title" => "Analyse en attente",
            "message" => "Nouvelle analyse pour " . $lab['patient_name'],
            "type" => "lab",
            "priority" => "medium",
            "time" => "Aujourd'hui"
        ];
    }

    // 3. Upcoming Appointments for today
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT * FROM appointments WHERE clinic_id = ? AND appointment_date = ?");
    $stmt->execute([$clinicId, $today]);
    $appts = $stmt->fetchAll();
    foreach ($appts as $appt) {
        $notifications[] = [
            "id" => "appt-" . $appt['id'],
            "title" => "Rendez-vous",
            "message" => $appt['patient'] . " à " . $appt['appointment_time'],
            "type" => "appointment",
            "priority" => "medium",
            "time" => $appt['appointment_time']
        ];
    }

    sendResponse($notifications);
}
?>

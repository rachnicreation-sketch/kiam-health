<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if (!$clinicId) {
        sendResponse(["status" => "error", "message" => "Clinic ID manquant"], 400);
    }

    $stats = [];

    // Patients Total
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM patients WHERE clinic_id = ?");
    $stmt->execute([$clinicId]);
    $stats['totalPatients'] = $stmt->fetch()['total'];

    // Consultations Today
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM consultations WHERE clinic_id = ? AND consultation_date = ?");
    $stmt->execute([$clinicId, $today]);
    $stats['consultationsToday'] = $stmt->fetch()['total'];

    // Active Hospitalized
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM admissions WHERE clinic_id = ? AND status = 'active'");
    $stmt->execute([$clinicId]);
    $stats['hospitalizedCount'] = $stmt->fetch()['total'];

    // Revenue Today (approximate from transactions)
    $stmt = $pdo->prepare("SELECT SUM(amount) as total FROM transactions WHERE clinic_id = ? AND transaction_date = ? AND type = 'income'");
    $stmt->execute([$clinicId, $today]);
    $res = $stmt->fetch();
    $stats['revenueToday'] = $res['total'] ?? 0;

    // Recent Patients (Last 4)
    $stmt = $pdo->prepare("SELECT * FROM patients WHERE clinic_id = ? ORDER BY created_at DESC LIMIT 4");
    $stmt->execute([$clinicId]);
    $stats['recentPatients'] = $stmt->fetchAll();

    // Upcoming Appointments (4)
    $stmt = $pdo->prepare("SELECT * FROM appointments WHERE clinic_id = ? AND appointment_date >= ? ORDER BY appointment_date ASC, appointment_time ASC LIMIT 4");
    $stmt->execute([$clinicId, $today]);
    $stats['upcomingAppointments'] = $stmt->fetchAll();

    sendResponse($stats);
}
?>

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
    $stmt = $pdo->prepare("SELECT a.*, p.name as patient_name, u.name as doctor_name 
                           FROM appointments a 
                           LEFT JOIN patients p ON a.patient_id = p.id 
                           LEFT JOIN users u ON a.doctor_id = u.id 
                           WHERE a.clinic_id = ? AND a.appointment_date >= ? 
                           ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 4");
    $stmt->execute([$clinicId, $today]);
    $stats['upcomingAppointments'] = $stmt->fetchAll();

    sendResponse($stats);
}
?>

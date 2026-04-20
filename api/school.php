<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list_students';
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list_students') {
        $stmt = $pdo->prepare("SELECT * FROM school_students WHERE clinic_id = ? ORDER BY name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_grades') {
        $studentId = $_GET['student_id'] ?? null;
        if ($studentId) {
            $stmt = $pdo->prepare("SELECT * FROM school_grades WHERE clinic_id = ? AND student_id = ? ORDER BY created_at DESC");
            $stmt->execute([$clinicId, $studentId]);
        } else {
            $stmt = $pdo->prepare("SELECT g.*, s.name, s.first_name 
                                   FROM school_grades g 
                                   JOIN school_students s ON g.student_id = s.id 
                                   WHERE g.clinic_id = ? 
                                   ORDER BY g.created_at DESC");
            $stmt->execute([$clinicId]);
        }
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'stats') {
        $stats = [
            "total_students" => $pdo->query("SELECT COUNT(*) FROM school_students WHERE clinic_id = '$clinicId'")->fetchColumn(),
            "active_students" => $pdo->query("SELECT COUNT(*) FROM school_students WHERE clinic_id = '$clinicId' AND status = 'active'")->fetchColumn()
        ];
        sendResponse($stats);
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    
    if ($action === 'add_student') {
        if (!$data['name'] || !$data['first_name'] || !$data['class_level']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }
        $id = "ST-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_students (id, clinic_id, name, first_name, class_level, tutor_name, tutor_phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id, $clinicId, $data['name'], $data['first_name'], $data['class_level'],
            $data['tutor_name'] ?? '', $data['tutor_phone'] ?? '', $data['address'] ?? '', 'active'
        ]);
        sendResponse(["status" => "success", "id" => $id]);
    } elseif ($action === 'add_grade') {
        if (!$data['student_id'] || !$data['subject'] || !isset($data['score'])) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }
        $id = "GR-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_grades (id, clinic_id, student_id, subject, score, coefficient, period, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id, $clinicId, $data['student_id'], $data['subject'], $data['score'],
            $data['coefficient'] ?? 1, $data['period'] ?? 'Trimestre 1', $data['comment'] ?? ''
        ]);
        sendResponse(["status" => "success", "id" => $id]);
    }
}
?>

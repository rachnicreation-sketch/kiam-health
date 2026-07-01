<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$clinicId = $auth['clinic_id'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'stats';

// Auto-table creation for School
try {
    $pdo->query("CREATE TABLE IF NOT EXISTS school_students (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        class_level VARCHAR(100),
        tutor_name VARCHAR(255),
        tutor_phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->query("CREATE TABLE IF NOT EXISTS school_payments (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        student_id VARCHAR(50),
        amount DECIMAL(10,2),
        payment_date DATE,
        type VARCHAR(50),
        method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->query("CREATE TABLE IF NOT EXISTS school_documents (
        id VARCHAR(50) PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        type VARCHAR(50),
        name VARCHAR(255),
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {}

if ($method === 'GET') {
    if ($action === 'stats') {
        $stats = [
            "total_students" => $pdo->query("SELECT COUNT(*) FROM school_students WHERE clinic_id = '$clinicId'")->fetchColumn(),
            "new_this_month" => $pdo->query("SELECT COUNT(*) FROM school_students WHERE clinic_id = '$clinicId' AND MONTH(created_at) = MONTH(CURDATE())")->fetchColumn(),
            "total_revenue" => $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM school_payments WHERE clinic_id = '$clinicId'")->fetchColumn(),
            "absences_today" => 0, // Placeholder
        ];
        sendResponse($stats);
    } elseif ($action === 'list_students') {
        $stmt = $pdo->prepare("SELECT * FROM school_students WHERE clinic_id = ? ORDER BY name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_classes') {
        $stmt = $pdo->prepare("SELECT c.*, (SELECT COUNT(*) FROM school_students s WHERE s.class_level = c.level OR s.class_id = c.id) as students_count FROM school_classes c WHERE c.clinic_id = ? ORDER BY level ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_payments') {
        $stmt = $pdo->prepare("SELECT p.*, s.name, s.first_name FROM school_payments p JOIN school_students s ON p.student_id = s.id WHERE p.clinic_id = ? ORDER BY p.payment_date DESC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_documents') {
        $studentId = $_GET['student_id'] ?? null;
        $stmt = $pdo->prepare("SELECT * FROM school_documents WHERE student_id = ? ORDER BY created_at DESC");
        $stmt->execute([$studentId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if ($action === 'add_student') {
        $id = "STU-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_students (id, clinic_id, name, first_name, class_level, tutor_name, tutor_phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id, $clinicId, $data['name'], $data['first_name'], $data['class_level'],
            $data['tutor_name'], $data['tutor_phone'], $data['address'] ?? ''
        ]);
        sendResponse(["status" => "success", "id" => $id]);
    } elseif ($action === 'add_class') {
        $id = "CLS-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_classes (id, clinic_id, name, level, room_number, teacher_id) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['name'], $data['level'], $data['room_number'], $data['teacher_id'] ?? '']);
        sendResponse(["status" => "success", "id" => $id]);
    } elseif ($action === 'add_payment') {
        $id = "PAY-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_payments (id, clinic_id, student_id, amount, payment_date, type, method) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['student_id'], $data['amount'], $data['date'], $data['type'] ?? 'Scolarité', $data['method'] ?? 'Espèces']);
        sendResponse(["status" => "success", "id" => $id]);
    } elseif ($action === 'update_class') {
        $stmt = $pdo->prepare("UPDATE school_classes SET name = ?, level = ?, room_number = ?, teacher_id = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['level'], $data['room_number'], $data['teacher_id'], $data['id']]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'delete_class') {
        $id = $data['id'] ?? $_GET['id'] ?? null;
        $stmt = $pdo->prepare("DELETE FROM school_classes WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'update_student') {
        $stmt = $pdo->prepare("UPDATE school_students SET name = ?, first_name = ?, class_level = ?, tutor_name = ?, tutor_phone = ?, address = ?, status = ? WHERE id = ?");
        $stmt->execute([
            $data['name'], $data['first_name'], $data['class_level'],
            $data['tutor_name'], $data['tutor_phone'], $data['address'], $data['status'], $data['id']
        ]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'delete_student') {
        $id = $data['id'] ?? $_GET['id'] ?? null;
        $stmt = $pdo->prepare("DELETE FROM school_students WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'add_document') {
        $id = "DOC-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_documents (id, student_id, type, name, file_url) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$id, $data['student_id'], $data['type'], $data['name'], $data['file_url']]);
        sendResponse(["status" => "success", "id" => $id]);
    }
}
?>

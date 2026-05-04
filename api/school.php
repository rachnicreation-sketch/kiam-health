<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list_students';
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list_students') {
        $stmt = $pdo->prepare("SELECT s.*, c.name as class_name FROM school_students s LEFT JOIN school_classes c ON s.class_id = c.id WHERE s.clinic_id = ? ORDER BY s.name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_teachers') {
        $stmt = $pdo->prepare("SELECT id, name, email, phone, role FROM users WHERE tenant_id = ? AND (role = 'teacher' OR role LIKE '%prof%')");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_classes') {
        $stmt = $pdo->prepare("SELECT c.*, u.name as teacher_name FROM school_classes c LEFT JOIN users u ON c.teacher_id = u.id WHERE c.tenant_id = ? ORDER BY c.level ASC, c.name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_subjects') {
        $stmt = $pdo->prepare("SELECT * FROM school_subjects WHERE tenant_id = ? ORDER BY name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_attendance') {
        $classId = $_GET['class_id'] ?? null;
        $date = $_GET['date'] ?? date('Y-m-d');
        $stmt = $pdo->prepare("SELECT a.*, s.name, s.first_name 
                               FROM school_attendance a 
                               JOIN school_students s ON a.student_id = s.id 
                               WHERE a.tenant_id = ? AND a.class_id = ? AND a.date = ?");
        $stmt->execute([$clinicId, $classId, $date]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_payments') {
        $stmt = $pdo->prepare("SELECT p.*, s.name, s.first_name 
                               FROM school_payments p 
                               JOIN school_students s ON p.student_id = s.id 
                               WHERE p.tenant_id = ? 
                               ORDER BY p.payment_date DESC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'stats') {
        $stats = [
            "total_students" => $pdo->query("SELECT COUNT(*) FROM school_students WHERE clinic_id = '$clinicId'")->fetchColumn(),
            "active_students" => $pdo->query("SELECT COUNT(*) FROM school_students WHERE clinic_id = '$clinicId' AND status = 'active'")->fetchColumn(),
            "classes_count" => $pdo->query("SELECT COUNT(*) FROM school_classes WHERE tenant_id = '$clinicId'")->fetchColumn(),
            "distribution" => $pdo->query("SELECT class_level, COUNT(*) as count FROM school_students WHERE clinic_id = '$clinicId' GROUP BY class_level")->fetchAll(),
            "recent_grades" => $pdo->query("SELECT g.*, s.name, s.first_name FROM school_grades g JOIN school_students s ON g.student_id = s.id WHERE g.clinic_id = '$clinicId' ORDER BY g.created_at DESC LIMIT 5")->fetchAll(),
            "today_attendance" => $pdo->query("SELECT COUNT(*) FROM school_attendance WHERE tenant_id = '$clinicId' AND date = CURDATE() AND status = 'present'")->fetchColumn(),
            "revenue" => $pdo->query("SELECT SUM(amount) FROM school_payments WHERE tenant_id = '$clinicId' AND status = 'paid'")->fetchColumn() ?: 0
        ];
        sendResponse($stats);
    } elseif ($action === 'list_grades') {
        $studentId = $_GET['student_id'] ?? null;
        if ($studentId) {
            $stmt = $pdo->prepare("SELECT * FROM school_grades WHERE clinic_id = ? AND student_id = ? ORDER BY created_at DESC");
            $stmt->execute([$clinicId, $studentId]);
        } else {
            $stmt = $pdo->prepare("SELECT g.*, s.name, s.first_name FROM school_grades g JOIN school_students s ON g.student_id = s.id WHERE g.clinic_id = ? ORDER BY g.created_at DESC");
            $stmt->execute([$clinicId]);
        }
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_schedule') {
        $classId = $_GET['class_id'] ?? null;
        if ($classId && $classId !== 'all') {
            $stmt = $pdo->prepare("SELECT * FROM school_schedule WHERE tenant_id = ? AND class_id = ? ORDER BY day ASC, start_time ASC");
            $stmt->execute([$clinicId, $classId]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM school_schedule WHERE tenant_id = ? ORDER BY day ASC, start_time ASC");
            $stmt->execute([$clinicId]);
        }
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_documents') {
        $studentId = $_GET['student_id'] ?? null;
        $stmt = $pdo->prepare("SELECT * FROM school_student_docs WHERE tenant_id = ? AND student_id = ? ORDER BY created_at DESC");
        $stmt->execute([$clinicId, $studentId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    
    if ($action === 'add_student') {
        if (!$data['name'] || !$data['first_name'] || !$data['class_level']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }
        $id = "ST-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_students (id, clinic_id, class_id, name, first_name, class_level, tutor_name, tutor_phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id, $clinicId, $data['class_id'] ?? null, $data['name'], $data['first_name'], $data['class_level'],
            $data['tutor_name'] ?? '', $data['tutor_phone'] ?? '', $data['address'] ?? '', 'active'
        ]);
        logActivity($pdo, $clinicId, $auth['id'], "Inscription élève", ["name" => $data['name'], "id" => $id]);
        sendResponse(["status" => "success", "id" => $id]);
    } elseif ($action === 'add_class') {
        $id = "CLS-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_classes (id, tenant_id, name, level, teacher_id, room_number) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['name'], $data['level'], $data['teacher_id'] ?? null, $data['room_number'] ?? '']);
        sendResponse(["status" => "success", "id" => $id]);
    } elseif ($action === 'add_subject') {
        $id = "SUB-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_subjects (id, tenant_id, name, coefficient) VALUES (?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['name'], $data['coefficient'] ?? 1]);
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
    } elseif ($action === 'take_attendance') {
        $pdo->beginTransaction();
        foreach ($data['records'] as $record) {
            $id = "ATT-" . time() . rand(100, 999);
            $stmt = $pdo->prepare("INSERT INTO school_attendance (id, tenant_id, student_id, class_id, date, status, comment) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $clinicId, $record['student_id'], $record['class_id'], $data['date'], $record['status'], $record['comment'] ?? '']);
        }
        $pdo->commit();
        sendResponse(["status" => "success"]);
    } elseif ($action === 'add_payment') {
        $id = "PAY-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_payments (id, tenant_id, student_id, amount, payment_date, type, status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['student_id'], $data['amount'], $data['date'], $data['type'], $data['status'], $data['method']]);
        sendResponse(["status" => "success", "id" => $id]);
    } elseif ($action === 'update_student') {
        $stmt = $pdo->prepare("UPDATE school_students SET name = ?, first_name = ?, class_level = ?, class_id = ?, tutor_name = ?, tutor_phone = ?, address = ?, status = ? WHERE id = ? AND clinic_id = ?");
        $stmt->execute([
            $data['name'], $data['first_name'], $data['class_level'], $data['class_id'] ?? null,
            $data['tutor_name'] ?? '', $data['tutor_phone'] ?? '', $data['address'] ?? '', $data['status'] ?? 'active',
            $data['id'], $clinicId
        ]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'delete_student') {
        $stmt = $pdo->prepare("DELETE FROM school_students WHERE id = ? AND clinic_id = ?");
        $stmt->execute([$data['id'], $clinicId]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'update_class') {
        $stmt = $pdo->prepare("UPDATE school_classes SET name = ?, level = ?, room_number = ?, teacher_id = ? WHERE id = ? AND tenant_id = ?");
        $stmt->execute([
            $data['name'], $data['level'], $data['room_number'] ?? '', $data['teacher_id'] ?? null,
            $data['id'], $clinicId
        ]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'delete_class') {
        $stmt = $pdo->prepare("DELETE FROM school_classes WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$data['id'], $clinicId]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'add_schedule') {
        $id = "SCH-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_schedule (id, tenant_id, class_id, subject, teacher_name, room, day, start_time, end_time, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id, $clinicId, $data['class_id'], $data['subject'], $data['teacher_name'], 
            $data['room'] ?? '', $data['day'], $data['start_time'], $data['end_time'], $data['color'] ?? 'bg-indigo-50'
        ]);
        sendResponse(["status" => "success", "id" => $id]);
    } elseif ($action === 'delete_schedule') {
        $stmt = $pdo->prepare("DELETE FROM school_schedule WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$data['id'], $clinicId]);
        sendResponse(["status" => "success"]);
    } elseif ($action === 'add_document') {
        $id = "DOC-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO school_student_docs (id, tenant_id, student_id, type, name, file_url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $clinicId, $data['student_id'], $data['type'], $data['name'], $data['file_url']]);
        sendResponse(["status" => "success", "id" => $id]);
    }
}
?>

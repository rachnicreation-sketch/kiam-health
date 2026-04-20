<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list_rooms';
$clinicId = $auth['tenant_id'];

if ($method === 'GET') {
    if ($action === 'list_rooms') {
        $stmt = $pdo->prepare("SELECT * FROM hotel_rooms WHERE clinic_id = ? ORDER BY room_number ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_bookings') {
        $stmt = $pdo->prepare("SELECT b.*, r.room_number, r.type as room_type 
                               FROM hotel_bookings b 
                               JOIN hotel_rooms r ON b.room_id = r.id 
                               WHERE b.clinic_id = ? 
                               ORDER BY b.check_in DESC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'stats') {
        $stats = [
            "total_rooms" => $pdo->query("SELECT COUNT(*) FROM hotel_rooms WHERE clinic_id = '$clinicId'")->fetchColumn(),
            "occupied" => $pdo->query("SELECT COUNT(*) FROM hotel_rooms WHERE clinic_id = '$clinicId' AND status = 'occupied'")->fetchColumn(),
            "available" => $pdo->query("SELECT COUNT(*) FROM hotel_rooms WHERE clinic_id = '$clinicId' AND status = 'available'")->fetchColumn(),
            "cleaning" => $pdo->query("SELECT COUNT(*) FROM hotel_rooms WHERE clinic_id = '$clinicId' AND status = 'cleaning'")->fetchColumn()
        ];
        sendResponse($stats);
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    
    if ($action === 'add_room') {
        if (!$data['room_number'] || !$data['type'] || !$data['price']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }
        $id = "RM-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("INSERT INTO hotel_rooms (id, clinic_id, room_number, type, category, price, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id, $clinicId, $data['room_number'], $data['type'], $data['category'] ?? 'Standard',
            $data['price'], 'available', $data['description'] ?? ''
        ]);
        sendResponse(["status" => "success", "id" => $id]);
    } elseif ($action === 'checkin') {
        if (!$data['room_id'] || !$data['guest_name'] || !$data['guest_phone']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }
        $id = "BK-" . time() . rand(10, 99);
        $pdo->beginTransaction();
        try {
            // Create booking
            $stmt = $pdo->prepare("INSERT INTO hotel_bookings (id, clinic_id, room_id, guest_name, guest_phone, check_in, status, total_amount) VALUES (?, ?, ?, ?, ?, NOW(), 'checked_in', ?)");
            $stmt->execute([$id, $clinicId, $data['room_id'], $data['guest_name'], $data['guest_phone'], $data['price'] ?? 0]);
            
            // Update room status
            $stmt = $pdo->prepare("UPDATE hotel_rooms SET status = 'occupied' WHERE id = ?");
            $stmt->execute([$data['room_id']]);
            
            $pdo->commit();
            sendResponse(["status" => "success", "id" => $id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
        }
    }
} elseif ($method === 'PUT') {
    $data = getRequestData();
    if ($action === 'checkout') {
        $pdo->beginTransaction();
        try {
            // Update booking
            $stmt = $pdo->prepare("UPDATE hotel_bookings SET check_out = NOW(), status = 'checked_out' WHERE id = ?");
            $stmt->execute([$data['booking_id']]);
            
            // Update room status to cleaning
            $stmt = $pdo->prepare("UPDATE hotel_rooms SET status = 'cleaning' WHERE id = ?");
            $stmt->execute([$data['room_id']]);
            
            $pdo->commit();
            sendResponse(["status" => "success"]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
        }
    }
}
?>

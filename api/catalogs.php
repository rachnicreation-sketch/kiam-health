<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list_acts';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list_acts' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM medical_acts WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    } elseif ($action === 'list_lab' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM lab_services WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if ($action === 'save_act') {
        if (!$data['clinicId'] || !$data['name'] || !$data['price']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }

        if (isset($data['id']) && !empty($data['id'])) {
            $stmt = $pdo->prepare("UPDATE medical_acts SET name = ?, category = ?, price = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['category'], $data['price'], $data['id']]);
            sendResponse(["status" => "success"]);
        } else {
            $id = "ACT-" . time();
            $stmt = $pdo->prepare("INSERT INTO medical_acts (id, clinic_id, name, category, price) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $data['clinicId'], $data['name'], $data['category'], $data['price']]);
            sendResponse(["status" => "success", "id" => $id]);
        }
    } elseif ($action === 'save_lab') {
        if (!$data['clinicId'] || !$data['testName'] || !$data['price']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }

        if (isset($data['id']) && !empty($data['id'])) {
            $stmt = $pdo->prepare("UPDATE lab_services SET test_name = ?, category = ?, price = ?, unit = ?, normative_value = ? WHERE id = ?");
            $stmt->execute([$data['testName'], $data['category'], $data['price'], $data['unit'], $data['normativeValue'], $data['id']]);
            sendResponse(["status" => "success"]);
        } else {
            $id = "LAB-" . time();
            $stmt = $pdo->prepare("INSERT INTO lab_services (id, clinic_id, test_name, category, price, unit, normative_value) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $data['clinicId'], $data['testName'], $data['category'], $data['price'], $data['unit'] ?? '', $data['normativeValue'] ?? '']);
            sendResponse(["status" => "success", "id" => $id]);
        }
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    $type = $_GET['type'] ?? 'act';
    if (!$id) {
        sendResponse(["status" => "error", "message" => "ID manquant"], 400);
    }

    if ($type === 'act') {
        $stmt = $pdo->prepare("DELETE FROM medical_acts WHERE id = ?");
    } else {
        $stmt = $pdo->prepare("DELETE FROM lab_services WHERE id = ?");
    }
    $stmt->execute([$id]);

    sendResponse(["status" => "success"]);
}
?>

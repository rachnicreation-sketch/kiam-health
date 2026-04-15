<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM guards WHERE clinic_id = ?");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = getRequestData();
    if ($action === 'auto') {
        // Logic de rotation auto (simplifiée côté PHP ou gérée côté Front)
        // Pour l'instant on laisse le front envoyer individuellement ou on pourrait faire un batch
        sendResponse(["status" => "success", "message" => "Veuillez envoyer les gardes individuellement ou implémenter le batch"]);
    } else {
        if (!$data['userId'] || !$data['date'] || !$data['clinicId']) {
            sendResponse(["status" => "error", "message" => "Données manquantes"], 400);
        }

        $id = "G-" . time() . "-" . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO guards (id, clinic_id, user_id, guard_date, quart, service_id) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $data['clinicId'],
            $data['userId'],
            $data['date'],
            $data['quart'] ?? 'morning',
            $data['serviceId'] ?? null
        ]);

        sendResponse(["status" => "success", "id" => $id]);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        sendResponse(["status" => "error", "message" => "ID manquant"], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM guards WHERE id = ?");
    $stmt->execute([$id]);

    sendResponse(["status" => "success"]);
}
?>

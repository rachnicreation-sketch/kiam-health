<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM medical_acts WHERE clinic_id = ? ORDER BY name ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
}
?>

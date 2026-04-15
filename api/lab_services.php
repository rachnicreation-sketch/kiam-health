<?php
require_once 'config.php';
require_once 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$clinicId = $_GET['clinicId'] ?? null;

if ($method === 'GET') {
    if ($action === 'list' && $clinicId) {
        $stmt = $pdo->prepare("SELECT * FROM lab_services WHERE clinic_id = ? ORDER BY testName ASC");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }
}
?>

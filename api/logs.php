<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$clinicId = $auth['tenant_id'];

$stmt = $pdo->prepare("SELECT l.*, u.name as user_name FROM activity_logs l JOIN users u ON l.user_id = u.id WHERE l.tenant_id = ? ORDER BY l.created_at DESC LIMIT 50");
$stmt->execute([$clinicId]);
sendResponse($stmt->fetchAll());
?>

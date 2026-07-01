<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$clinicId = $auth['tenant_id'];

// Get activity logs for this tenant
// We join with global users to get the name, or fall back to local users
$stmt = $pdo->prepare("
    SELECT 
        l.*, 
        COALESCE(gu.email, u.name, 'Système') as user_display_name
    FROM kiam_audit_logs l
    LEFT JOIN kiam_global_users gu ON l.user_id = gu.id
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.tenant_id = ?
    ORDER BY l.created_at DESC
    LIMIT 100
");
$stmt->execute([$clinicId]);
$logs = $stmt->fetchAll();

sendResponse($logs);
?>

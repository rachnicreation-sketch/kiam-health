<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_GET['action'] = 'tenants';
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once 'api/config.php';
    require_once 'api/functions.php';
    
    $stmt = $pdo->query("
        SELECT t.*, p.name as plan_name, p.price as plan_price,
               gu.email as admin_email, gu.full_name as admin_name,
               (SELECT COUNT(*) FROM kiam_global_users WHERE tenant_id = t.id) as user_count
        FROM kiam_tenants t 
        LEFT JOIN kiam_plans p ON t.plan_id = p.id 
        LEFT JOIN kiam_global_users gu ON gu.tenant_id = t.id AND gu.global_role = 'tenant_admin'
        ORDER BY t.created_at DESC
    ");
    $res = $stmt->fetchAll();
    echo "Query count: " . count($res) . "\n";
} catch (Exception $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>

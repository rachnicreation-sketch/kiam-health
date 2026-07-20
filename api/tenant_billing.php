<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$tenantId = $auth['tenant_id'];

$action = $_GET['action'] ?? '';

if ($action === 'current_plan') {
    $stmt = $pdo->prepare("
        SELECT t.subscription_status, t.next_billing_date, t.trial_ends_at, p.*
        FROM kiam_tenants t
        LEFT JOIN kiam_plans p ON t.plan_id = p.id
        WHERE t.id = ?
    ");
    $stmt->execute([$tenantId]);
    $plan = $stmt->fetch();
    
    sendResponse(["status" => "success", "plan" => $plan]);
} 
elseif ($action === 'my_invoices') {
    $stmt = $pdo->prepare("
        SELECT * FROM kiam_subscriptions 
        WHERE tenant_id = ? 
        ORDER BY created_at DESC
    ");
    $stmt->execute([$tenantId]);
    $invoices = $stmt->fetchAll();
    
    sendResponse(["status" => "success", "invoices" => $invoices]);
}
else {
    sendResponse(["status" => "error", "message" => "Action non valide"], 400);
}

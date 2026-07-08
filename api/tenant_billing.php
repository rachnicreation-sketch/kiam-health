<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$clinicId = $auth['tenant_id'] ?? ($auth['clinic_id'] ?? null);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'current_plan';

if ($method === 'GET') {
    if ($action === 'current_plan') {
        // Get tenant's current plan info
        $stmt = $pdo->prepare("
            SELECT t.*, p.name as plan_name, p.price, p.max_users, p.modules_included 
            FROM kiam_tenants t 
            LEFT JOIN kiam_plans p ON t.plan_id = p.id 
            WHERE t.id = ?
        ");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetch());

    } elseif ($action === 'available_plans') {
        // List all plans for the tenant to choose from
        $stmt = $pdo->query("SELECT * FROM kiam_plans ORDER BY price ASC");
        sendResponse($stmt->fetchAll());

    } elseif ($action === 'my_invoices') {
        // List only invoices for this tenant
        $stmt = $pdo->prepare("
            SELECT s.*, p.name as plan_name 
            FROM kiam_subscriptions s 
            LEFT JOIN kiam_plans p ON s.plan_id = p.id 
            WHERE s.tenant_id = ? 
            ORDER BY s.payment_date DESC
        ");
        $stmt->execute([$clinicId]);
        sendResponse($stmt->fetchAll());
    }

} elseif ($method === 'POST') {
    $data = getRequestData();
    
    if ($action === 'change_plan') {
        // Logic to request or change plan (will mark as pending or active depending on payment)
        $stmt = $pdo->prepare("UPDATE kiam_tenants SET plan_id = ?, subscription_status = 'active' WHERE id = ?");
        $stmt->execute([$data['plan_id'], $clinicId]);
        
        // Log the action
        $stmt = $pdo->prepare("INSERT INTO kiam_audit_logs (event, user_email, status) VALUES (?, ?, 'success')");
        $stmt->execute(["Upgrade Plan: " . $data['plan_id'], $auth['email']]);
        
        sendResponse(["status" => "success", "message" => "Votre forfait a été mis à jour."]);
    } elseif ($action === 'pay_stripe' || $action === 'pay_mobile_money') {
        if (empty($data['amount']) || empty($data['plan_id'])) {
            sendResponse(["status" => "error", "message" => "Données de paiement incomplètes."], 400);
        }

        // Simulate payment transaction registration
        $subId = "SUB-" . time() . rand(10, 99);
        $stmt = $pdo->prepare("
            INSERT INTO kiam_subscriptions (id, tenant_id, plan_id, amount, payment_status, payment_method, payment_date)
            VALUES (?, ?, ?, ?, 'paid', ?, NOW())
        ");
        $method = ($action === 'pay_stripe') ? 'Stripe' : 'MobileMoney';
        $stmt->execute([$subId, $clinicId, $data['plan_id'], $data['amount'], $method]);

        // Update tenant status to active
        $stmt = $pdo->prepare("UPDATE kiam_tenants SET subscription_status = 'active', plan_id = ? WHERE id = ?");
        $stmt->execute([$data['plan_id'], $clinicId]);

        // Log audit log
        $stmt = $pdo->prepare("INSERT INTO kiam_audit_logs (event, user_email, status) VALUES (?, ?, 'success')");
        $stmt->execute(["Paiement SaaS : " . $method . " pour " . $data['plan_id'], $auth['email']]);

        sendResponse(["status" => "success", "message" => "Paiement réussi !", "subscription_id" => $subId]);
    }
}
?>

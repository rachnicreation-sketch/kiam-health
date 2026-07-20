<?php
require_once 'config.php';
require_once 'functions.php';

$auth = requireAuth();
$tenantId = $auth['tenant_id'];

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendResponse(["status" => "error", "message" => "Méthode non autorisée."], 405);
}

$data = getRequestData();
$planId = $data['plan_id'] ?? '';
$billingFrequency = $data['billing_frequency'] ?? 'monthly';
$paymentMethod = $data['payment_method'] ?? 'credit_card';
$selectedAddons = $data['addons'] ?? []; // Array of addon IDs

if (!$planId) {
    sendResponse(["status" => "error", "message" => "Le forfait est requis."], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch Plan Details
    $stmt = $pdo->prepare("SELECT price_monthly, price_yearly FROM kiam_plans WHERE id = ?");
    $stmt->execute([$planId]);
    $plan = $stmt->fetch();

    if (!$plan) {
        throw new Exception("Forfait invalide.");
    }

    $planPrice = ($billingFrequency === 'yearly') ? $plan['price_yearly'] : $plan['price_monthly'];
    $totalAmount = (float)$planPrice;

    // 2. Clear old addons for tenant
    $stmt = $pdo->prepare("DELETE FROM kiam_tenant_modules WHERE tenant_id = ?");
    $stmt->execute([$tenantId]);

    // 3. Process Addons
    if (!empty($selectedAddons)) {
        $addonQuery = $pdo->prepare("SELECT name, module_name, price_monthly FROM kiam_addons WHERE id = ?");
        $insertModule = $pdo->prepare("INSERT INTO kiam_tenant_modules (tenant_id, module_name, is_active) VALUES (?, ?, 1)");
        
        foreach ($selectedAddons as $addonId) {
            $addonQuery->execute([$addonId]);
            $addon = $addonQuery->fetch();
            if ($addon) {
                $addonPrice = ($billingFrequency === 'yearly') ? ((float)$addon['price_monthly'] * 12) : (float)$addon['price_monthly'];
                $totalAmount += $addonPrice;
                
                // Activer le module
                $insertModule->execute([$tenantId, $addon['module_name']]);
            }
        }
    }

    // 4. Update Tenant
    $nextBillingDate = ($billingFrequency === 'yearly') ? date('Y-m-d', strtotime('+1 year')) : date('Y-m-d', strtotime('+1 month'));
    $mrrValue = ($billingFrequency === 'yearly') ? ($totalAmount / 12) : $totalAmount;

    $stmt = $pdo->prepare("
        UPDATE kiam_tenants 
        SET plan_id = ?, 
            subscription_status = 'active', 
            next_billing_date = ?, 
            mrr_value = ? 
        WHERE id = ?
    ");
    $stmt->execute([$planId, $nextBillingDate, $mrrValue, $tenantId]);

    // 5. Create Subscription Record (Transaction / Invoice)
    $subId = "SUB-" . strtoupper(substr(md5(uniqid()), 0, 10));
    $stmt = $pdo->prepare("
        INSERT INTO kiam_subscriptions 
        (id, tenant_id, plan_id, status, start_date, expiration_date, amount_paid, payment_method, billing_frequency) 
        VALUES (?, ?, ?, 'active', NOW(), ?, ?, ?, ?)
    ");
    $stmt->execute([
        $subId, 
        $tenantId, 
        $planId, 
        $nextBillingDate . " 23:59:59", 
        $totalAmount, 
        $paymentMethod, 
        $billingFrequency
    ]);

    $pdo->commit();

    sendResponse([
        "status" => "success", 
        "message" => "Abonnement activé avec succès.",
        "amount" => $totalAmount,
        "next_billing_date" => $nextBillingDate
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    sendResponse(["status" => "error", "message" => $e->getMessage()], 500);
}

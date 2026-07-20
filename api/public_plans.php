<?php
require_once 'config.php';

// Allow CORS for public access if needed
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

try {
    $stmt = $pdo->query("
        SELECT id, name, price_monthly, price_yearly, max_users, max_storage_gb, features, is_popular, description 
        FROM kiam_plans 
        ORDER BY price_monthly ASC
    ");
    
    $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode features JSON for the frontend
    foreach ($plans as &$plan) {
        if ($plan['features']) {
            $plan['features'] = json_decode($plan['features'], true);
        } else {
            $plan['features'] = [];
        }
        
        $plan['price_monthly'] = (float)$plan['price_monthly'];
        $plan['price_yearly'] = (float)$plan['price_yearly'];
        $plan['is_popular'] = (bool)$plan['is_popular'];
    }

    echo json_encode([
        "status" => "success",
        "data" => $plans
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur de chargement des forfaits."
    ]);
}

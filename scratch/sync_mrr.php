<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once 'api/config.php';

try {
    $pdo->exec("UPDATE kiam_plans SET price_monthly = 50000 WHERE id = 'plan_basic'");
    $pdo->exec("UPDATE kiam_plans SET price_monthly = 150000 WHERE id = 'plan_pro'");
    $pdo->exec("UPDATE kiam_plans SET price_monthly = 500000 WHERE id = 'plan_ent'");

    $pdo->exec("UPDATE kiam_tenants t JOIN kiam_plans p ON t.plan_id = p.id SET t.mrr_value = p.price_monthly");

    echo "Prices and MRR synced successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

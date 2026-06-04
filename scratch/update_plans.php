<?php
require_once __DIR__ . '/../api/config.php';

echo "=== UPDATE PLANS ===\n";
$allModules = "health,pharmacy,hotel,school,erp,shop,enterprise,hr";

// Update all existing plans to include all modules
$stmt = $pdo->prepare("UPDATE kiam_plans SET modules_included = ?");
$stmt->execute([$allModules]);
echo "Updated plans to include modules: $allModules\n";

// Print updated plans
$plans = $pdo->query("SELECT id, name, modules_included FROM kiam_plans")->fetchAll();
print_r($plans);

// Also verify that the demo tenants have modules
echo "\n=== END ===\n";
?>

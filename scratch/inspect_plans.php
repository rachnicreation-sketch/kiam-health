<?php
require_once __DIR__ . '/../api/config.php';

echo "=== PLANS ===\n";
$plans = $pdo->query("SELECT id, name, price, max_users, modules_included FROM kiam_plans")->fetchAll();
foreach ($plans as $p) {
    echo "ID: {$p['id']}, Name: {$p['name']}, Modules: {$p['modules_included']}\n";
}
?>

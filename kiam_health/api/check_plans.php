<?php
require_once 'config.php';

echo "=== KIAM PLANS ===\n";
$stmt = $pdo->query("SELECT * FROM kiam_plans");
$plans = $stmt->fetchAll();

if (empty($plans)) {
    echo "NO PLANS FOUND. Re-seeding...\n";
    $pdo->exec("INSERT INTO kiam_plans (id, name, price, max_users) VALUES 
        ('basic', 'Plan Basique', 25000, 5),
        ('pro', 'Plan Pro', 75000, 20),
        ('enterprise', 'Plan Enterprise', 150000, 100)");
    echo "Plans seeded: basic, pro, enterprise\n";
} else {
    foreach ($plans as $p) {
        echo "ID: {$p['id']} | Name: {$p['name']}\n";
    }
}
?>

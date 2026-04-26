<?php
require_once 'config.php';

echo "=== GLOBAL USERS ===\n";
$stmt = $pdo->query("SELECT email, global_role FROM kiam_global_users");
$users = $stmt->fetchAll();
foreach ($users as $u) {
    echo "Email: {$u['email']} | Role: {$u['global_role']}\n";
}
?>

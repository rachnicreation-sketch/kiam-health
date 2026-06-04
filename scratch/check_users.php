<?php
require_once __DIR__ . '/../api/config.php';

try {
    echo "--- GLOBAL USERS ---\n";
    $stmt = $pdo->query("SELECT id, email, tenant_id, global_role, is_active FROM kiam_global_users");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }

    echo "\n--- LOCAL USERS ---\n";
    $stmt = $pdo->query("SELECT id, name, email, role, clinic_id FROM users");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

<?php
$pdo = new PDO('mysql:host=127.0.0.1', 'root', '');

// Check kiam_global_users structure
try {
    $stmt = $pdo->query('DESCRIBE kiam_saas.kiam_global_users');
    echo "kiam_global_users columns:\n";
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $col) {
        echo "  - " . $col['Field'] . " (" . $col['Type'] . ")\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// List all global users
try {
    $stmt = $pdo->query('SELECT id, username, email, global_role, tenant_id FROM kiam_saas.kiam_global_users');
    echo "\nGlobal users:\n";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error fetching users: " . $e->getMessage() . "\n";
}

// Also check if kiam_health.users has username now
try {
    $stmt = $pdo->query('SELECT id, username, name, email FROM kiam_health.users');
    echo "\nkiam_health users:\n";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "kiam_health error: " . $e->getMessage() . "\n";
}

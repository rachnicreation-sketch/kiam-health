<?php
require_once __DIR__ . '/../api/config.php';

try {
    $stmt = $pdo->query("SELECT id, name, sector, subscription_status FROM kiam_tenants");
    $tenants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "--- TENANTS LIST ---\n";
    foreach ($tenants as $tenant) {
        printf("ID: %s | Name: %s | Sector: %s | Status: %s\n", 
            $tenant['id'], $tenant['name'], $tenant['sector'], $tenant['subscription_status']);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

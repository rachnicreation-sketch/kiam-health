<?php
require_once __DIR__ . '/../api/config.php';
try {
    $pdo->exec("ALTER TABLE kiam_tenants MODIFY COLUMN subscription_status ENUM('active', 'trial', 'past_due', 'canceled', 'suspended') DEFAULT 'trial'");
    echo "SUCCESS: Status 'suspended' added to ENUM.";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
?>

<?php
require_once 'c:/wamp64/www/kiam/api/config.php';
try {
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(", ", $tables) . "\n";
    foreach(["kiam_tenants", "kiam_plans", "kiam_support_tickets", "kiam_system_announcements"] as $t) {
        if (in_array($t, $tables)) {
            $count = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
            echo "$t: $count rows\n";
        } else {
            echo "$t: MISSING\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>

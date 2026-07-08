<?php
// Analyse de toutes les tables dans chaque base de données tenant
$pdo = new PDO('mysql:host=127.0.0.1', 'root', '');
$tenants = ['kiam_health', 'kiam_hopital', 'kiam_ecole', 'kiam_erp', 'kiam_ges', 'kiam_hotel', 'kiam_caisse', 'kiam_saas'];

foreach ($tenants as $db) {
    try {
        $stmt = $pdo->query("SHOW TABLES FROM {$db}");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "[{$db}]: " . implode(', ', $tables) . "\n";
    } catch (Exception $e) {
        echo "[{$db}]: ERROR - " . $e->getMessage() . "\n";
    }
}

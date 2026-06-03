<?php
require_once 'api/config.php';
$stmt = $pdo->query('SELECT sector, COUNT(*) as count FROM kiam_tenants GROUP BY sector');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>

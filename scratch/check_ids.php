<?php
require_once 'api/config.php';
$stmt = $pdo->query('SELECT id FROM kiam_plans');
print_r($stmt->fetchAll(PDO::FETCH_COLUMN));
?>

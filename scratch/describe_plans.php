<?php
require_once 'api/config.php';
$stmt = $pdo->query('DESCRIBE kiam_plans');
print_r($stmt->fetchAll());
?>

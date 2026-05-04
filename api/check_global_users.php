<?php
require_once 'config.php';
$stmt = $pdo->query('SELECT email, password_hash FROM kiam_global_users');
print_r($stmt->fetchAll());
?>

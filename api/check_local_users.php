<?php
require_once 'config.php';
$stmt = $pdo->query('SELECT email, password_hash, clinic_id FROM users');
print_r($stmt->fetchAll());
?>

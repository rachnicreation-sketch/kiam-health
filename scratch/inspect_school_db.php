<?php
require_once 'api/config.php';

$res = [];

// List school tables
$stmt = $pdo->query("SHOW TABLES LIKE 'school_%'");
$res['tables'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

// Describe school tables
foreach ($res['tables'] as $table) {
    $stmt = $pdo->query("DESCRIBE $table");
    $res['schemas'][$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Describe users table
$stmt = $pdo->query("DESCRIBE users");
$res['schemas']['users'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($res, JSON_PRETTY_PRINT);
?>

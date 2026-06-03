<?php
require_once __DIR__ . '/../api/config.php';
$pdo->exec("DROP TABLE IF EXISTS kiam_announcements");
echo "Old table dropped.";
?>

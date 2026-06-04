<?php
require_once __DIR__ . '/../api/config.php';

echo "=== MODULES ===\n";
$modules = $pdo->query("SELECT * FROM kiam_modules")->fetchAll();
print_r($modules);
?>

<?php
$pdo = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');
$colsUsers = $pdo->query('SHOW COLUMNS FROM users')->fetchAll(PDO::FETCH_COLUMN);
$colsPlans = $pdo->query('SHOW COLUMNS FROM kiam_plans')->fetchAll(PDO::FETCH_COLUMN);
$colsApps = $pdo->query('SHOW COLUMNS FROM appointments')->fetchAll(PDO::FETCH_COLUMN);
$colsPayrolls = $pdo->query('SHOW COLUMNS FROM payrolls')->fetchAll(PDO::FETCH_COLUMN);
print_r(compact('colsUsers', 'colsPlans', 'colsApps', 'colsPayrolls'));

<?php
$pdo = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');
print_r($pdo->query('SHOW COLUMNS FROM invoices')->fetchAll(PDO::FETCH_COLUMN));

<?php
$pdo = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');
print_r($pdo->query('SELECT id, name FROM clinics')->fetchAll(PDO::FETCH_ASSOC));

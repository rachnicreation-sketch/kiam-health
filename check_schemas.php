<?php
$pdo = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');
$clinics = $pdo->query('SHOW CREATE TABLE clinics')->fetch(PDO::FETCH_ASSOC);
$beds = $pdo->query('SHOW CREATE TABLE beds')->fetch(PDO::FETCH_ASSOC);
$users = $pdo->query('SHOW CREATE TABLE users')->fetch(PDO::FETCH_ASSOC);
print_r($clinics['Create Table'] . "\n\n");
print_r($beds['Create Table'] . "\n\n");
print_r($users['Create Table'] . "\n\n");

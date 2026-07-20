<?php
$pdo = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');
$pdo->exec('ALTER TABLE users ADD COLUMN photo_url TEXT DEFAULT NULL');
echo "photo_url added.";

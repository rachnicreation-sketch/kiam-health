<?php
$pdoTarget = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');
$targetTables = $pdoTarget->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
print_r($targetTables);

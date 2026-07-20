<?php
$pdoSource = new PDO('mysql:host=localhost;dbname=kiam_health', 'root', '');
$pdoTarget = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');

$tables = $pdoSource->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
$targetTables = $pdoTarget->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

foreach ($tables as $table) {
    if (!in_array($table, $targetTables)) {
        echo 'Creating table: ' . $table . "\n";
        $createStmt = $pdoSource->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
        $pdoTarget->exec($createStmt['Create Table']);
    }
}

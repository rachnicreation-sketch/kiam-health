<?php
require_once 'config.php';

echo "=== TABLE CONSTRAINTS ===\n";
$stmt = $pdo->query("
    SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        CONSTRAINT_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
    FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
        REFERENCED_TABLE_SCHEMA = 'kiam_saas' AND
        TABLE_NAME = 'kiam_tenants'
");
$constraints = $stmt->fetchAll();
foreach ($constraints as $c) {
    echo "Table: {$c['TABLE_NAME']} | Col: {$c['COLUMN_NAME']} | Refs: {$c['REFERENCED_TABLE_NAME']}({$c['REFERENCED_COLUMN_NAME']})\n";
}
?>

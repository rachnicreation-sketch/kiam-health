<?php
$pdo = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$queries = [
    'ALTER TABLE payrolls ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
    'ALTER TABLE users ADD COLUMN specialty VARCHAR(255) DEFAULT NULL;',
    'ALTER TABLE plans ADD COLUMN max_branches INT DEFAULT 1;',
    'ALTER TABLE appointments ADD COLUMN doctor_id INT DEFAULT NULL;',
    'ALTER TABLE messages ADD COLUMN clinic_id VARCHAR(50) DEFAULT NULL;',
];

foreach ($queries as $q) {
    try {
        $pdo->exec($q);
        echo 'Success: ' . $q . "\n";
    } catch (Exception $e) {
        echo 'Error: ' . $e->getMessage() . "\n";
    }
}

<?php
$pdo = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$alters = [
    // patients
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INT DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob DATE DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS city VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS id_number VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10) DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS assurance VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT NULL",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_history TEXT DEFAULT NULL",
];

foreach ($alters as $q) {
    try {
        $pdo->exec(str_replace('IF NOT EXISTS ', '', $q));
    } catch (Exception $e) {}
}
echo "Patients columns synced.";

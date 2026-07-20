<?php
$pdo = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$alters = [
    "ALTER TABLE payrolls ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE users ADD COLUMN specialty VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN clinic_id VARCHAR(50) DEFAULT NULL",
    "UPDATE users SET clinic_id = tenant_id WHERE clinic_id IS NULL",
    "ALTER TABLE kiam_plans ADD COLUMN max_branches INT DEFAULT 999",
    "ALTER TABLE appointments ADD COLUMN doctor_id INT DEFAULT NULL",
    "ALTER TABLE appointments ADD COLUMN type VARCHAR(50) DEFAULT 'standard'",
    "ALTER TABLE consultations ADD COLUMN doctor_id INT DEFAULT NULL",
    "ALTER TABLE consultations ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
];

foreach ($alters as $q) {
    try {
        $pdo->exec($q);
        echo "Success: $q\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), '1060') === false) { // 1060 is duplicate column
            echo "Error: $q -> " . $e->getMessage() . "\n";
        }
    }
}

// 3. Fix missing tables by dropping and recreating or copying from health if they didn't copy
$pdoHealth = new PDO('mysql:host=localhost;dbname=kiam_health', 'root', '');
$tables = ['internal_messages', 'messages', 'catalogs', 'medical_acts'];
foreach ($tables as $t) {
    try {
        $stmt = $pdoHealth->query("SHOW CREATE TABLE `$t`");
        if ($stmt) {
            $createStmt = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($createStmt) {
                $pdo->exec("CREATE TABLE IF NOT EXISTS `$t` " . substr($createStmt['Create Table'], 13 + strlen($t)));
                echo "Ensured table $t exists.\n";
            }
        }
    } catch (Exception $e) {}
}

echo "Fixes applied.\n";

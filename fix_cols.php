<?php
$pdo = new PDO('mysql:host=localhost;dbname=kiam_saas', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$alters = [
    // Invoices
    "ALTER TABLE invoices ADD COLUMN insurance_company VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE invoices ADD COLUMN insurance_coverage DECIMAL(10,2) DEFAULT 0",
    "ALTER TABLE invoices ADD COLUMN amount_insurance DECIMAL(10,2) DEFAULT 0",
    "ALTER TABLE invoices ADD COLUMN amount_patient DECIMAL(10,2) DEFAULT 0",
    
    // Employees
    "ALTER TABLE employees ADD COLUMN birth_place VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN nationality VARCHAR(100) DEFAULT 'Camerounaise'",
    "ALTER TABLE employees ADD COLUMN marital_status VARCHAR(50) DEFAULT 'Célibataire'",
    "ALTER TABLE employees ADD COLUMN children_count INT DEFAULT 0",
    "ALTER TABLE employees ADD COLUMN address TEXT DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN niu VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN id_card_type VARCHAR(50) DEFAULT 'CNI'",
    "ALTER TABLE employees ADD COLUMN id_card_number VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN id_card_expiry DATE DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN rib VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN bank_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN emergency_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN emergency_phone VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN emergency_relation VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN echelon VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN contract_end_date DATE DEFAULT NULL",
    "ALTER TABLE employees ADD COLUMN tax_regime VARCHAR(100) DEFAULT 'salarie_prive'",
    "ALTER TABLE employees ADD COLUMN transport_allowance DECIMAL(10,2) DEFAULT 0",
    "ALTER TABLE employees ADD COLUMN housing_allowance DECIMAL(10,2) DEFAULT 0",
    "ALTER TABLE employees ADD COLUMN meal_allowance DECIMAL(10,2) DEFAULT 0",
    "ALTER TABLE employees ADD COLUMN notes TEXT DEFAULT NULL",
];

foreach ($alters as $q) {
    try {
        $pdo->exec($q);
        echo "Success: $q\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), '1060') === false) {
            echo "Error: $q -> " . $e->getMessage() . "\n";
        }
    }
}
echo "Columns added.\n";

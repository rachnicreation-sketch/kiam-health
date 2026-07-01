<?php
require_once 'config.php';

$migrations = [];

// ─── EMPLOYEES TABLE — Add missing columns ────────────────────────────────────
$empColumns = $pdo->query("SHOW COLUMNS FROM employees")->fetchAll(PDO::FETCH_COLUMN);

$addColumns = [
    // Identity
    "niu"                    => "ALTER TABLE employees ADD COLUMN niu VARCHAR(50) NULL COMMENT 'Numéro d identité unique'",
    "rib"                    => "ALTER TABLE employees ADD COLUMN rib VARCHAR(100) NULL COMMENT 'Relevé Identité Bancaire'",
    "bank_name"              => "ALTER TABLE employees ADD COLUMN bank_name VARCHAR(100) NULL",
    "id_card_number"         => "ALTER TABLE employees ADD COLUMN id_card_number VARCHAR(100) NULL",
    "id_card_type"           => "ALTER TABLE employees ADD COLUMN id_card_type ENUM('CNI','Passeport','Permis','Titre_sejour') NULL DEFAULT 'CNI'",
    "id_card_expiry"         => "ALTER TABLE employees ADD COLUMN id_card_expiry DATE NULL",
    "birth_date"             => "ALTER TABLE employees ADD COLUMN birth_date DATE NULL",
    "birth_place"            => "ALTER TABLE employees ADD COLUMN birth_place VARCHAR(150) NULL",
    "nationality"            => "ALTER TABLE employees ADD COLUMN nationality VARCHAR(80) NULL DEFAULT 'Camerounaise'",
    "gender"                 => "ALTER TABLE employees ADD COLUMN gender ENUM('M','F') NULL DEFAULT 'M'",
    "marital_status"         => "ALTER TABLE employees ADD COLUMN marital_status ENUM('Célibataire','Marié','Veuf','Divorcé') NULL DEFAULT 'Célibataire'",
    "children_count"         => "ALTER TABLE employees ADD COLUMN children_count TINYINT UNSIGNED NULL DEFAULT 0",
    "address"                => "ALTER TABLE employees ADD COLUMN address TEXT NULL",
    "phone"                  => "ALTER TABLE employees ADD COLUMN phone VARCHAR(30) NULL",
    "email"                  => "ALTER TABLE employees ADD COLUMN email VARCHAR(150) NULL",
    // Emergency contact
    "emergency_name"         => "ALTER TABLE employees ADD COLUMN emergency_name VARCHAR(200) NULL",
    "emergency_phone"        => "ALTER TABLE employees ADD COLUMN emergency_phone VARCHAR(30) NULL",
    "emergency_relation"     => "ALTER TABLE employees ADD COLUMN emergency_relation VARCHAR(80) NULL",
    // Contract
    "contract_type"          => "ALTER TABLE employees ADD COLUMN contract_type ENUM('CDI','CDD','Stage','Vacataire','Consultant') NULL DEFAULT 'CDI'",
    "contract_end_date"      => "ALTER TABLE employees ADD COLUMN contract_end_date DATE NULL",
    "echelon"                => "ALTER TABLE employees ADD COLUMN echelon VARCHAR(30) NULL COMMENT 'Catégorie / Echelon SMIG'",
    // Payroll references
    "transport_allowance"    => "ALTER TABLE employees ADD COLUMN transport_allowance DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'Indemnité de transport mensuelle'",
    "housing_allowance"      => "ALTER TABLE employees ADD COLUMN housing_allowance DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'Indemnité de logement'",
    "meal_allowance"         => "ALTER TABLE employees ADD COLUMN meal_allowance DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'Panier repas'",
    "tax_regime"             => "ALTER TABLE employees ADD COLUMN tax_regime ENUM('salarie_prive','fonctionnaire','exonere') NULL DEFAULT 'salarie_prive'",
    "notes"                  => "ALTER TABLE employees ADD COLUMN notes TEXT NULL",
    "photo_url"              => "ALTER TABLE employees ADD COLUMN photo_url TEXT NULL",
    "created_at"             => "ALTER TABLE employees ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
];

foreach ($addColumns as $col => $sql) {
    if (!in_array($col, $empColumns)) {
        try {
            $pdo->exec($sql);
            $migrations[] = "✅ employees.$col — ajouté";
        } catch (Exception $e) {
            $migrations[] = "⚠️  employees.$col — " . $e->getMessage();
        }
    } else {
        $migrations[] = "ℹ️  employees.$col — déjà existant";
    }
}

// ─── PAYROLLS TABLE — Add CNSS/TOL/Tax breakdown columns ─────────────────────
$prColumns = $pdo->query("SHOW COLUMNS FROM payrolls")->fetchAll(PDO::FETCH_COLUMN);

$addPrColumns = [
    "gross_salary"         => "ALTER TABLE payrolls ADD COLUMN gross_salary DECIMAL(15,2) NULL COMMENT 'Salaire brut (base + primes)'",
    "transport_allowance"  => "ALTER TABLE payrolls ADD COLUMN transport_allowance DECIMAL(12,2) NULL DEFAULT 0",
    "housing_allowance"    => "ALTER TABLE payrolls ADD COLUMN housing_allowance DECIMAL(12,2) NULL DEFAULT 0",
    "meal_allowance"       => "ALTER TABLE payrolls ADD COLUMN meal_allowance DECIMAL(12,2) NULL DEFAULT 0",
    "bonuses_total"        => "ALTER TABLE payrolls ADD COLUMN bonuses_total DECIMAL(15,2) NULL DEFAULT 0",
    "deductions_total"     => "ALTER TABLE payrolls ADD COLUMN deductions_total DECIMAL(15,2) NULL DEFAULT 0",
    // Employee-side deductions
    "cnss_employee"        => "ALTER TABLE payrolls ADD COLUMN cnss_employee DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'CNSS part salariale (2.8%)'",
    "irpp"                 => "ALTER TABLE payrolls ADD COLUMN irpp DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'IRPP retenu à la source'",
    "cac"                  => "ALTER TABLE payrolls ADD COLUMN cac DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'CAC 10% sur IRPP'",
    "advance_deduction"    => "ALTER TABLE payrolls ADD COLUMN advance_deduction DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'Avances sur salaire'",
    // Employer-side contributions
    "cnss_employer"        => "ALTER TABLE payrolls ADD COLUMN cnss_employer DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'CNSS part patronale (14.7%)'",
    "cr_employer"          => "ALTER TABLE payrolls ADD COLUMN cr_employer DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'Crédit de retraite patronal (4.2%)'",
    "at_employer"          => "ALTER TABLE payrolls ADD COLUMN at_employer DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'Accidents de travail patronal (1.75%)'",
    "pf_employer"          => "ALTER TABLE payrolls ADD COLUMN pf_employer DECIMAL(12,2) NULL DEFAULT 0 COMMENT 'Prestations familiales patronal (7%)'",
    "total_labor_cost"     => "ALTER TABLE payrolls ADD COLUMN total_labor_cost DECIMAL(15,2) NULL DEFAULT 0 COMMENT 'Coût Total Employeur (CTE)'",
    "notes"                => "ALTER TABLE payrolls ADD COLUMN notes TEXT NULL",
    "created_at"           => "ALTER TABLE payrolls ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
];

foreach ($addPrColumns as $col => $sql) {
    if (!in_array($col, $prColumns)) {
        try {
            $pdo->exec($sql);
            $migrations[] = "✅ payrolls.$col — ajouté";
        } catch (Exception $e) {
            $migrations[] = "⚠️  payrolls.$col — " . $e->getMessage();
        }
    } else {
        $migrations[] = "ℹ️  payrolls.$col — déjà existant";
    }
}

// ─── PAYROLL_ITEMS — upgrade enum to include tax/cnss types ──────────────────
try {
    $pdo->exec("ALTER TABLE payroll_items MODIFY COLUMN type ENUM('bonus','deduction','tax','cnss_employee','cnss_employer','irpp','allowance') NOT NULL DEFAULT 'bonus'");
    $migrations[] = "✅ payroll_items.type enum — étendu";
} catch (Exception $e) {
    $migrations[] = "⚠️  payroll_items.type — " . $e->getMessage();
}

// ─── Output ───────────────────────────────────────────────────────────────────
echo "=== KIAM HR v2 — Migration Database ===\n\n";
foreach ($migrations as $m) {
    echo $m . "\n";
}
echo "\n=== TERMINÉ ===\n";
?>

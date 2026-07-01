<?php
/**
 * Kiam ERP – Advanced Features Init Script (v2)
 */
require_once __DIR__ . '/config.php';

try {
    // 1. PRODUCT FRACTIONAL UNITS
    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_product_units (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        unit_name VARCHAR(50) NOT NULL, -- e.g., '500g', 'Sac 25kg'
        conversion_factor DECIMAL(10,5) NOT NULL, -- e.g., 0.50000, 25.00000
        price_sell DECIMAL(15,2) DEFAULT NULL, -- Specific price or proportional if NULL
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic_prod (clinic_id, product_id)
    )");

    // 2. PHYSICAL INVENTORY AUDITS
    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_physical_inventories (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        inventory_number VARCHAR(30) NOT NULL,
        status ENUM('draft', 'validated') DEFAULT 'draft',
        notes TEXT,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        validated_at TIMESTAMP NULL,
        INDEX idx_clinic (clinic_id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_physical_inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_id VARCHAR(50) NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        qty_theoretical DECIMAL(15,3) NOT NULL,
        qty_real DECIMAL(15,3) NOT NULL,
        qty_discrepancy DECIMAL(15,3) NOT NULL,
        reason ENUM('theft', 'damage', 'loss', 'expired', 'error', 'other') DEFAULT 'error',
        notes TEXT,
        INDEX idx_inv (inventory_id)
    )");

    // 3. OHADA ACCOUNTS CHART
    $pdo->exec("CREATE TABLE IF NOT EXISTS ohada_accounts (
        account_code VARCHAR(20) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        label VARCHAR(200) NOT NULL,
        account_type VARCHAR(50) NOT NULL, -- Asset, Liability, Equity, Income, Expense
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 4. OHADA JOURNAL ENTRIES
    $pdo->exec("CREATE TABLE IF NOT EXISTS ohada_journal_entries (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        entry_date DATE NOT NULL,
        journal_code VARCHAR(10) NOT NULL, -- VE (Ventes), AC (Achats), CA (Caisse), BQ (Banque), OD (Opérations Diverses)
        reference VARCHAR(100),
        label VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic_date (clinic_id, entry_date)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS ohada_journal_lines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entry_id VARCHAR(50) NOT NULL,
        account_code VARCHAR(20) NOT NULL,
        debit DECIMAL(15,2) DEFAULT 0,
        credit DECIMAL(15,2) DEFAULT 0,
        partner_id VARCHAR(50) NULL, -- Client or Supplier ID
        INDEX idx_entry (entry_id),
        INDEX idx_account (account_code)
    )");

    // 5. COMMERCIAL DOCUMENTS
    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_quotes (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        quote_number VARCHAR(30) NOT NULL,
        customer_id VARCHAR(50) NULL,
        customer_name VARCHAR(100),
        total_ht DECIMAL(15,2) DEFAULT 0,
        tax_rate DECIMAL(5,2) DEFAULT 0,
        total_ttc DECIMAL(15,2) DEFAULT 0,
        status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
        valid_until DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic (clinic_id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_quote_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quote_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        quantity DECIMAL(15,3) NOT NULL,
        unit VARCHAR(30),
        unit_price DECIMAL(15,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        INDEX idx_quote (quote_id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_delivery_slips (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        slip_number VARCHAR(30) NOT NULL,
        order_id VARCHAR(50) NULL,
        customer_id VARCHAR(50) NULL,
        customer_name VARCHAR(100),
        status ENUM('preparation', 'shipped', 'delivered', 'returned') DEFAULT 'preparation',
        shipped_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic (clinic_id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_delivery_slip_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slip_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        qty_ordered DECIMAL(15,3) DEFAULT 0,
        qty_shipped DECIMAL(15,3) DEFAULT 0,
        INDEX idx_slip (slip_id)
    )");

    // 6. MIGRATE & EXTEND EXISTING TABLES
    // Extend inventory_items
    $cols = [
        'brand' => 'VARCHAR(100) DEFAULT NULL',
        'model' => 'VARCHAR(100) DEFAULT NULL',
        'reference' => 'VARCHAR(100) DEFAULT NULL',
        'color' => 'VARCHAR(50) DEFAULT NULL',
        'pieces_count' => 'INT DEFAULT NULL'
    ];
    foreach ($cols as $colName => $colDef) {
        try {
            $pdo->exec("ALTER TABLE inventory_items ADD COLUMN $colName $colDef");
        } catch (Exception $e) { /* column already exists */ }
    }

    // Extend erp_customers
    $custCols = [
        'credit_limit' => 'DECIMAL(15,2) DEFAULT 0',
        'debt_balance' => 'DECIMAL(15,2) DEFAULT 0',
        'payment_terms' => 'VARCHAR(50) DEFAULT \'immediate\''
    ];
    foreach ($custCols as $colName => $colDef) {
        try {
            $pdo->exec("ALTER TABLE erp_customers ADD COLUMN $colName $colDef");
        } catch (Exception $e) { /* column already exists */ }
    }

    // Populate initial OHADA Chart of Accounts if empty
    $count = $pdo->query("SELECT COUNT(*) FROM ohada_accounts")->fetchColumn();
    if ($count == 0) {
        $initialAccounts = [
            // Actif Immobilisé / Capitaux (Classe 1, 2)
            ['101000', 'Capital social', 'Equity'],
            ['211000', 'Terrains', 'Asset'],
            ['241000', 'Matériel et outillage', 'Asset'],
            ['244000', 'Matériel de transport', 'Asset'],
            // Stocks (Classe 3)
            ['311000', 'Stocks de marchandises', 'Asset'],
            // Tiers (Classe 4)
            ['401100', 'Fournisseurs ordinaires', 'Liability'],
            ['411100', 'Clients ordinaires', 'Asset'],
            ['442000', 'TVA Facturée sur ventes', 'Liability'],
            ['443000', 'TVA Récupérable sur achats', 'Asset'],
            // Trésorerie (Classe 5)
            ['521000', 'Banques locales', 'Asset'],
            ['571000', 'Caisse générale', 'Asset'],
            // Charges (Classe 6)
            ['601100', 'Achats de marchandises', 'Expense'],
            ['605000', 'Électricité, eau', 'Expense'],
            ['658000', 'Pertes sur créances / Dégâts stock', 'Expense'],
            // Produits (Classe 7)
            ['701100', 'Ventes de marchandises', 'Income'],
            ['707000', 'Produits accessoires', 'Income'],
        ];

        $stmt = $pdo->prepare("INSERT INTO ohada_accounts (account_code, clinic_id, label, account_type) VALUES (?, 'system', ?, ?)");
        foreach ($initialAccounts as $acc) {
            $stmt->execute([$acc[0], $acc[1], $acc[2]]);
        }
    }

    echo json_encode(["status" => "success", "message" => "ERP Pro Advanced schema tables successfully initialized."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database Setup Failed: " . $e->getMessage()]);
}
?>

<?php
/**
 * Kiam Pharmacy – Database schema initializer
 */
require_once __DIR__ . '/config.php';

try {
    // 1. EXTEND medications TABLE
    $medCols = [
        'code_product' => 'VARCHAR(100) DEFAULT NULL',
        'barcode' => 'VARCHAR(100) DEFAULT NULL',
        'dci' => 'VARCHAR(255) DEFAULT NULL',
        'form' => 'VARCHAR(100) DEFAULT NULL',
        'dosage' => 'VARCHAR(100) DEFAULT NULL',
        'presentation' => 'VARCHAR(255) DEFAULT NULL',
        'brand' => 'VARCHAR(100) DEFAULT NULL',
        'supplier' => 'VARCHAR(255) DEFAULT NULL',
        'price_buy' => 'DECIMAL(15,2) DEFAULT 0',
        'price_wholesale' => 'DECIMAL(15,2) DEFAULT 0',
        'stock_max' => 'INT DEFAULT NULL',
        'storage_location' => 'VARCHAR(100) DEFAULT NULL',
        'description' => 'TEXT DEFAULT NULL',
        'image' => 'TEXT DEFAULT NULL'
    ];

    foreach ($medCols as $colName => $colDef) {
        try {
            $pdo->exec("ALTER TABLE medications ADD COLUMN $colName $colDef");
        } catch (Exception $e) { /* column exists */ }
    }
    // Ensure barcode uniqueness per clinic
    try {
        $pdo->exec("CREATE UNIQUE INDEX idx_med_barcode ON medications (clinic_id, barcode)");
    } catch (Exception $e) { /* index may already exist */ }
    

    // 2. CREATE BATCHES TABLE
    $pdo->exec("CREATE TABLE IF NOT EXISTS medication_batches (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        medication_id VARCHAR(50) NOT NULL,
        batch_number VARCHAR(100) NOT NULL,
        mfg_date DATE DEFAULT NULL,
        expiry_date DATE NOT NULL,
        quantity INT DEFAULT 0,
        remaining_qty INT DEFAULT 0,
        price_buy DECIMAL(15,2) DEFAULT 0,
        supplier VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_med_expiry (medication_id, expiry_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 3. CREATE INTERNAL CLINIC PHARMACY REQUESTS TABLES
    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_internal_requests (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        service_name VARCHAR(100) NOT NULL,
        status ENUM('pending', 'validated', 'prepared', 'delivered', 'refused') DEFAULT 'pending',
        notes TEXT DEFAULT NULL,
        created_by VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_internal_request_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id VARCHAR(50) NOT NULL,
        medication_id VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        INDEX idx_req (request_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 4. CREATE PATIENT ADMINISTRATIONS LOG
    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_patient_administrations (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        patient_id VARCHAR(50) NOT NULL,
        consultation_id VARCHAR(50) DEFAULT NULL,
        hospitalization_id VARCHAR(50) DEFAULT NULL,
        prescription_id VARCHAR(50) DEFAULT NULL,
        medication_id VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        price_sell DECIMAL(15,2) DEFAULT 0,
        administered_by VARCHAR(100) DEFAULT NULL,
        administered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pat (patient_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 5. CREATE COMMERCIAL CUSTOMERS (Fichier client, Mutuelles, Assurances)
    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_customers (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        type ENUM('individual', 'company', 'insurance', 'mutuelle') NOT NULL,
        name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255) DEFAULT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        email VARCHAR(100) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        credit_limit DECIMAL(15,2) DEFAULT 0,
        debt_balance DECIMAL(15,2) DEFAULT 0,
        company_name VARCHAR(255) DEFAULT NULL,
        insurance_agreement TEXT DEFAULT NULL,
        reimbursement_rate DECIMAL(5,2) DEFAULT 0,
        ceiling DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic_cust (clinic_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 6. CREATE PRESCRIPTIONS TABLE
    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_prescriptions (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        doctor_name VARCHAR(255) DEFAULT NULL,
        institution VARCHAR(255) DEFAULT NULL,
        prescription_date DATE DEFAULT NULL,
        file_url TEXT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 7. CREATE CASH REGISTRY SESSIONS TABLES
    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_cash_sessions (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        status ENUM('open', 'closed') DEFAULT 'open',
        opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL DEFAULT NULL,
        opening_balance DECIMAL(15,2) DEFAULT 0,
        closing_balance DECIMAL(15,2) DEFAULT 0,
        total_sales DECIMAL(15,2) DEFAULT 0,
        total_expenses DECIMAL(15,2) DEFAULT 0,
        discrepancy DECIMAL(15,2) DEFAULT 0,
        notes TEXT DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_cash_transactions (
        id VARCHAR(50) PRIMARY KEY,
        session_id VARCHAR(50) NOT NULL,
        type ENUM('in', 'out') NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sess (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 8. CREATE CREDIT SALES CONTRACTS TABLES
    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_credit_contracts (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        customer_id VARCHAR(50) NOT NULL,
        sale_id VARCHAR(50) DEFAULT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        remaining_amount DECIMAL(15,2) NOT NULL,
        due_date DATE DEFAULT NULL,
        status ENUM('pending', 'partially_paid', 'paid', 'overdue') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cust (customer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_credit_payments (
        id VARCHAR(50) PRIMARY KEY,
        contract_id VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_contract (contract_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 9. CREATE COMMERCIAL DOCUMENTS TABLES
    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_commercial_docs (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        type ENUM('quote', 'invoice', 'purchase_order', 'delivery_slip') NOT NULL,
        doc_number VARCHAR(50) NOT NULL,
        customer_id VARCHAR(50) DEFAULT NULL,
        supplier_id VARCHAR(50) DEFAULT NULL,
        total_ht DECIMAL(15,2) DEFAULT 0,
        tax_rate DECIMAL(5,2) DEFAULT 0,
        total_ttc DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) DEFAULT NULL,
        insurance_amount DECIMAL(15,2) DEFAULT 0,
        patient_amount DECIMAL(15,2) DEFAULT 0,
        due_date DATE DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_by VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic_type (clinic_id, type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_commercial_doc_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doc_id VARCHAR(50) NOT NULL,
        medication_id VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        unit_type VARCHAR(50) DEFAULT 'box',
        unit_price DECIMAL(15,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        batch_id VARCHAR(50) DEFAULT NULL,
        INDEX idx_doc (doc_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 10. CREATE PHYSICAL INVENTORIES TABLES
    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_physical_inventories (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        status ENUM('draft', 'validated') DEFAULT 'draft',
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        validated_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_clinic (clinic_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_physical_inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_id VARCHAR(50) NOT NULL,
        medication_id VARCHAR(50) NOT NULL,
        batch_id VARCHAR(50) DEFAULT NULL,
        expected_qty INT NOT NULL,
        actual_qty INT NOT NULL,
        difference INT NOT NULL,
        reason VARCHAR(255) DEFAULT NULL,
        INDEX idx_inv (inventory_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 11. CREATE PHARMACY SETTINGS TABLE (full schema)
    $pdo->exec("CREATE TABLE IF NOT EXISTS pharmacy_settings (
        clinic_id VARCHAR(50) PRIMARY KEY,
        pharmacy_name VARCHAR(200) DEFAULT 'Pharmacie',
        address TEXT DEFAULT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        email VARCHAR(100) DEFAULT NULL,
        rccm VARCHAR(100) DEFAULT NULL,
        contribuable VARCHAR(100) DEFAULT NULL,
        tva_enabled TINYINT(1) DEFAULT 0,
        tva_rate DECIMAL(5,2) DEFAULT 18.00,
        ca_enabled TINYINT(1) DEFAULT 0,
        ca_rate DECIMAL(5,2) DEFAULT 5.00,
        receipt_footer TEXT DEFAULT NULL,
        currency VARCHAR(10) DEFAULT 'CFA',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Safely add missing columns to pharmacy_settings (idempotent ALTER)
    $alterCols = [
        "pharmacy_name" => "ALTER TABLE pharmacy_settings ADD COLUMN pharmacy_name VARCHAR(200) DEFAULT 'Pharmacie'",
        "address"       => "ALTER TABLE pharmacy_settings ADD COLUMN address TEXT DEFAULT NULL",
        "phone"         => "ALTER TABLE pharmacy_settings ADD COLUMN phone VARCHAR(50) DEFAULT NULL",
        "email"         => "ALTER TABLE pharmacy_settings ADD COLUMN email VARCHAR(100) DEFAULT NULL",
        "rccm"          => "ALTER TABLE pharmacy_settings ADD COLUMN rccm VARCHAR(100) DEFAULT NULL",
        "contribuable"  => "ALTER TABLE pharmacy_settings ADD COLUMN contribuable VARCHAR(100) DEFAULT NULL",
        "receipt_footer"=> "ALTER TABLE pharmacy_settings ADD COLUMN receipt_footer TEXT DEFAULT NULL",
        "currency"      => "ALTER TABLE pharmacy_settings ADD COLUMN currency VARCHAR(10) DEFAULT 'CFA'"
    ];
    foreach ($alterCols as $col => $sql) {
        try { $pdo->exec($sql); } catch (PDOException $ex) { /* Column already exists – ignore */ }
    }

    
    echo json_encode(["status" => "success", "message" => "Pharmacy database schema successfully initialized."]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database setup failed: " . $e->getMessage()]);
}
?>

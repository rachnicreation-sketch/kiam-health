-- ============================================================================
-- MIGRATION PHASE 3 : MODULE ERP COMPLET - KIAM CAISSE
-- ============================================================================
-- Cette migration ajoute :
-- 1. Gestion des unités et fractions
-- 2. Gestion avancée des stocks et inventaire
-- 3. Module Approvisionnement / Achats complet
-- 4. Module Comptabilité OHADA
-- 5. Gestion clients et ventes à crédit
-- 6. Gestion documentaire commerciale

-- ============================================================================
-- 1. GESTION DES UNITES ET FRACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_units (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    description TEXT,
    `type` ENUM('base', 'fraction', 'derivative') DEFAULT 'base',
    base_unit_id INT,
    conversion_factor DECIMAL(10, 4) DEFAULT 1,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (base_unit_id) REFERENCES product_units(id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Unités standards prédéfinies
INSERT IGNORE INTO product_units (code, name, abbreviation, `type`, conversion_factor, tenant_id) VALUES
('KG', 'Kilogramme', 'kg', 'base', 1, 0),
('G', 'Gramme', 'g', 'fraction', 0.001, 0),
('L', 'Litre', 'l', 'base', 1, 0),
('ML', 'Millilitre', 'ml', 'fraction', 0.001, 0),
('M', 'Mètre', 'm', 'base', 1, 0),
('CM', 'Centimètre', 'cm', 'fraction', 0.01, 0),
('UNIT', 'Unité', 'un', 'base', 1, 0),
('BOX', 'Boîte', 'box', 'derivative', 1, 0);

CREATE TABLE IF NOT EXISTS product_unit_fractions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    unit_id INT NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL,
    price_multiplier DECIMAL(10, 4) DEFAULT 1,
    display_name VARCHAR(100),
    `order` INT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES product_units(id),
    UNIQUE KEY unique_product_unit (product_id, unit_id),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 2. GESTION AVANCEE DES STOCKS ET INVENTAIRE
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    movement_type ENUM('entry', 'exit', 'transfer', 'adjustment', 'inventory', 'return') NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL,
    unit_id INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    from_warehouse_id INT,
    to_warehouse_id INT,
    reason TEXT,
    user_id INT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES product_units(id),
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_product (product_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_created (created_at),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS warehouses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenant_id),
    INDEX idx_main (is_main)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_levels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    unit_id INT NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL DEFAULT 0,
    alert_threshold DECIMAL(12, 4),
    max_stock DECIMAL(12, 4),
    tenant_id INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (unit_id) REFERENCES product_units(id),
    UNIQUE KEY unique_stock (product_id, warehouse_id, unit_id),
    INDEX idx_alert (alert_threshold),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS physical_inventories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id INT NOT NULL,
    status ENUM('draft', 'in_progress', 'completed', 'validated') DEFAULT 'draft',
    inventory_date DATE NOT NULL,
    comments TEXT,
    user_id INT,
    validated_by INT,
    validated_at TIMESTAMP NULL,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (validated_by) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_date (inventory_date),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventory_id INT NOT NULL,
    product_id INT NOT NULL,
    unit_id INT NOT NULL,
    expected_quantity DECIMAL(12, 4),
    counted_quantity DECIMAL(12, 4),
    variance DECIMAL(12, 4),
    variance_reason VARCHAR(100),
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES physical_inventories(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (unit_id) REFERENCES product_units(id),
    UNIQUE KEY unique_inventory_item (inventory_id, product_id, unit_id),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 3. MODULE APPROVISIONNEMENT / ACHATS
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_order_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL,
    unit_id INT NOT NULL,
    purchase_price DECIMAL(12, 4) NOT NULL,
    suggested_selling_price DECIMAL(12, 4),
    brand VARCHAR(100),
    model VARCHAR(100),
    reference VARCHAR(50),
    color VARCHAR(50),
    pieces_count INT,
    total_value DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * purchase_price) STORED,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product (product_id),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_order_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('cash', 'credit', 'bank_transfer', 'check', 'mobile_money', 'other') NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    user_id INT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_payment_method (payment_method),
    INDEX idx_date (payment_date),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 4. MODULE COMPTABILITE OHADA
-- ============================================================================

CREATE TABLE IF NOT EXISTS accounting_chart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense', 'intermediate') NOT NULL,
    account_category VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (account_code),
    INDEX idx_type (account_type),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS accounting_journal (
    id INT PRIMARY KEY AUTO_INCREMENT,
    journal_code VARCHAR(20) NOT NULL,
    journal_name VARCHAR(100) NOT NULL,
    journal_type ENUM('sales', 'purchases', 'bank', 'cash', 'general') NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_journal (journal_code, tenant_id),
    INDEX idx_type (journal_type),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS accounting_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    journal_id INT NOT NULL,
    entry_date DATE NOT NULL,
    entry_number VARCHAR(50),
    reference_type VARCHAR(50),
    reference_id INT,
    description TEXT,
    status ENUM('draft', 'validated', 'archived') DEFAULT 'draft',
    user_id INT,
    validated_by INT,
    validated_at TIMESTAMP NULL,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (journal_id) REFERENCES accounting_journal(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (validated_by) REFERENCES users(id),
    INDEX idx_date (entry_date),
    INDEX idx_status (status),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS accounting_entry_lines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entry_id INT NOT NULL,
    account_id INT NOT NULL,
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    line_number INT,
    description TEXT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES accounting_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounting_chart(id),
    INDEX idx_account (account_id),
    INDEX idx_entry (entry_id),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS accounting_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    accounting_period VARCHAR(10) NOT NULL,
    debit_balance DECIMAL(15, 2) DEFAULT 0,
    credit_balance DECIMAL(15, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    tenant_id INT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounting_chart(id),
    UNIQUE KEY unique_balance (account_id, accounting_period, tenant_id),
    INDEX idx_period (accounting_period),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS accounting_automate_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL,
    trigger_type ENUM('sale', 'purchase', 'payment', 'receipt', 'adjustment') NOT NULL,
    source_account INT,
    destination_account INT,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_account) REFERENCES accounting_chart(id),
    FOREIGN KEY (destination_account) REFERENCES accounting_chart(id),
    INDEX idx_trigger (trigger_type),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 5. GESTION CLIENTS ET VENTES A CREDIT
-- ============================================================================

-- Amélioration de la table clients existante (compatible MySQL 5.7+)
SET @db_name = DATABASE();
SET @table_name = 'clients';

-- Ajoute credit_limit si la colonne n'existe pas
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = @table_name AND COLUMN_NAME = 'credit_limit');
SET @alter_sql = IF(@col_exists = 0, 
    'ALTER TABLE clients ADD COLUMN credit_limit DECIMAL(15, 2) DEFAULT 0', 
    'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajoute current_balance si la colonne n'existe pas
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = @table_name AND COLUMN_NAME = 'current_balance');
SET @alter_sql = IF(@col_exists = 0, 
    'ALTER TABLE clients ADD COLUMN current_balance DECIMAL(15, 2) DEFAULT 0', 
    'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajoute credit_type si la colonne n'existe pas
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = @table_name AND COLUMN_NAME = 'credit_type');
SET @alter_sql = IF(@col_exists = 0, 
    'ALTER TABLE clients ADD COLUMN credit_type ENUM(\'cash\', \'credit\', \'both\') DEFAULT \'both\'', 
    'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajoute payment_terms si la colonne n'existe pas
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = @table_name AND COLUMN_NAME = 'payment_terms');
SET @alter_sql = IF(@col_exists = 0, 
    'ALTER TABLE clients ADD COLUMN payment_terms INT COMMENT \'Délai de paiement en jours\'', 
    'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajoute is_blocked si la colonne n'existe pas
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = @table_name AND COLUMN_NAME = 'is_blocked');
SET @alter_sql = IF(@col_exists = 0, 
    'ALTER TABLE clients ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE', 
    'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajoute blocked_reason si la colonne n'existe pas
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = @table_name AND COLUMN_NAME = 'blocked_reason');
SET @alter_sql = IF(@col_exists = 0, 
    'ALTER TABLE clients ADD COLUMN blocked_reason TEXT', 
    'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS credit_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    transaction_type ENUM('sale', 'payment', 'adjustment') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    description TEXT,
    user_id INT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_client (client_id),
    INDEX idx_type (transaction_type),
    INDEX idx_date (transaction_date),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS credit_payment_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    credit_transaction_id INT NOT NULL,
    client_id INT NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(15, 2) NOT NULL,
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    status ENUM('pending', 'partial', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    payment_date DATE,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (credit_transaction_id) REFERENCES credit_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 6. GESTION DOCUMENTAIRE COMMERCIALE
-- ============================================================================

CREATE TABLE IF NOT EXISTS quotations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT NOT NULL,
    quotation_date DATE NOT NULL,
    expiry_date DATE,
    status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
    total_ht DECIMAL(15, 2),
    tax_amount DECIMAL(15, 2),
    total_ttc DECIMAL(15, 2),
    notes TEXT,
    internal_notes TEXT,
    user_id INT,
    sent_date TIMESTAMP NULL,
    acceptance_date TIMESTAMP NULL,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_date (quotation_date),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quotation_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quotation_id INT NOT NULL,
    product_id INT NOT NULL,
    unit_id INT NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL,
    unit_price DECIMAL(12, 4) NOT NULL,
    line_total DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    description TEXT,
    line_order INT,
    tenant_id INT NOT NULL,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (unit_id) REFERENCES product_units(id),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    sale_type ENUM('cash', 'credit') DEFAULT 'cash',
    status ENUM('unpaid', 'partially_paid', 'paid', 'cancelled') DEFAULT 'unpaid',
    total_ht DECIMAL(15, 2),
    tax_amount DECIMAL(15, 2),
    total_ttc DECIMAL(15, 2),
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    balance_due DECIMAL(15, 2),
    payment_terms INT COMMENT 'Jours',
    notes TEXT,
    user_id INT,
    quotation_id INT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (quotation_id) REFERENCES quotations(id),
    INDEX idx_status (status),
    INDEX idx_sale_type (sale_type),
    INDEX idx_date (invoice_date),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    product_id INT NOT NULL,
    unit_id INT NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL,
    unit_price DECIMAL(12, 4) NOT NULL,
    line_total DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    description TEXT,
    line_order INT,
    tenant_id INT NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (unit_id) REFERENCES product_units(id),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoice_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    payment_amount DECIMAL(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'credit', 'bank_transfer', 'check', 'mobile_money', 'other') NOT NULL,
    reference VARCHAR(100),
    user_id INT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_method (payment_method),
    INDEX idx_date (payment_date),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT NOT NULL,
    po_date DATE NOT NULL,
    expected_delivery_date DATE,
    status ENUM('pending', 'validated', 'ordered', 'received', 'cancelled') DEFAULT 'pending',
    total_ht DECIMAL(15, 2),
    tax_amount DECIMAL(15, 2),
    total_ttc DECIMAL(15, 2),
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    notes TEXT,
    user_id INT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_date (po_date),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS delivery_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    delivery_note_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INT,
    supplier_id INT,
    delivery_date DATE NOT NULL,
    status ENUM('prepared', 'shipped', 'delivered', 'returned') DEFAULT 'prepared',
    notes TEXT,
    user_id INT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_date (delivery_date),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS delivery_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    delivery_note_id INT NOT NULL,
    product_id INT NOT NULL,
    unit_id INT NOT NULL,
    quantity_ordered DECIMAL(12, 4),
    quantity_delivered DECIMAL(12, 4),
    tenant_id INT NOT NULL,
    FOREIGN KEY (delivery_note_id) REFERENCES delivery_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (unit_id) REFERENCES product_units(id),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- TABLES DE SYNCHRONISATION ET D'AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    operation_type VARCHAR(50) NOT NULL,
    source_module VARCHAR(50),
    affected_modules VARCHAR(200),
    reference_type VARCHAR(50),
    reference_id INT,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    user_id INT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_trail (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    action VARCHAR(50),
    old_values JSON,
    new_values JSON,
    user_id INT,
    tenant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- INDEXES DE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- ============================================================================
-- FIN DE MIGRATION PHASE 3
-- ============================================================================

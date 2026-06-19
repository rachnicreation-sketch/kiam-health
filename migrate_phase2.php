<?php
/**
 * KIAM Phase 2 Migration
 * - Module 20: Retours Clients & Fournisseurs
 * - Module 21: Promotions
 * - Module 22: Fidélité
 * - Module 19: Transferts de Stock
 * - Module 23: Alertes
 */
require 'api/config.php';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ── 1. RETOURS (Module 20) ──────────────────────────────────────────
    $pdo->exec("
    CREATE TABLE IF NOT EXISTS pharmacy_returns (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        type ENUM('customer','supplier') NOT NULL,
        doc_id VARCHAR(50) NULL COMMENT 'Lien vers la facture/bon d''origine',
        customer_id VARCHAR(50) NULL,
        supplier_id VARCHAR(50) NULL,
        status ENUM('pending','validated','rejected') DEFAULT 'pending',
        reason TEXT,
        total_amount DECIMAL(15,2) DEFAULT 0,
        refund_method ENUM('cash','credit_note','exchange') DEFAULT 'credit_note',
        processed_by VARCHAR(100),
        validated_by VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        validated_at TIMESTAMP NULL,
        INDEX idx_clinic_returns (clinic_id),
        INDEX idx_return_type (type),
        INDEX idx_return_doc (doc_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
    CREATE TABLE IF NOT EXISTS pharmacy_return_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_id VARCHAR(50) NOT NULL,
        medication_id VARCHAR(50) NOT NULL,
        batch_id VARCHAR(50) NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(15,2) DEFAULT 0,
        total_price DECIMAL(15,2) DEFAULT 0,
        reason VARCHAR(255),
        FOREIGN KEY (return_id) REFERENCES pharmacy_returns(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // ── 2. PROMOTIONS (Module 21) ───────────────────────────────────────
    $pdo->exec("
    CREATE TABLE IF NOT EXISTS pharmacy_promotions (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        name VARCHAR(150) NOT NULL,
        type ENUM('percentage','fixed_amount','buy_x_get_y') NOT NULL,
        value DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Valeur de la remise (% ou montant)',
        buy_qty INT NULL COMMENT 'Pour buy_x_get_y: quantité à acheter',
        free_qty INT NULL COMMENT 'Pour buy_x_get_y: quantité offerte',
        applies_to ENUM('all','category','product') DEFAULT 'all',
        target_id VARCHAR(50) NULL COMMENT 'ID du produit ou catégorie ciblée',
        min_purchase DECIMAL(15,2) DEFAULT 0 COMMENT 'Montant minimum d''achat',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic_promo (clinic_id),
        INDEX idx_promo_dates (start_date, end_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // ── 3. FIDÉLITÉ (Module 22) ─────────────────────────────────────────
    $pdo->exec("
    CREATE TABLE IF NOT EXISTS pharmacy_loyalty_config (
        clinic_id VARCHAR(50) PRIMARY KEY,
        points_per_unit DECIMAL(10,2) DEFAULT 1 COMMENT 'Points gagnés par unité de devise dépensée',
        currency_per_point DECIMAL(10,2) DEFAULT 10 COMMENT 'Valeur en devise de chaque point',
        min_redeem_points INT DEFAULT 100 COMMENT 'Minimum de points pour un échange',
        is_active BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Ajouter colonnes fidélité aux clients existants
    try { $pdo->exec("ALTER TABLE pharmacy_customers ADD COLUMN loyalty_points INT DEFAULT 0"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE pharmacy_customers ADD COLUMN loyalty_tier ENUM('bronze','silver','gold','platinum') DEFAULT 'bronze'"); } catch(Exception $e) {}

    $pdo->exec("
    CREATE TABLE IF NOT EXISTS pharmacy_loyalty_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        customer_id VARCHAR(50) NOT NULL,
        type ENUM('earn','redeem') NOT NULL,
        points INT NOT NULL,
        reference_id VARCHAR(50) NULL COMMENT 'ID de la vente ou du bon',
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_loyalty_customer (customer_id),
        INDEX idx_loyalty_clinic (clinic_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // ── 4. TRANSFERTS DE STOCK (Module 19) ──────────────────────────────
    $pdo->exec("
    CREATE TABLE IF NOT EXISTS pharmacy_stock_transfers (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        from_location VARCHAR(100) NOT NULL COMMENT 'Source: magasin, rayon, succursale',
        to_location VARCHAR(100) NOT NULL COMMENT 'Destination',
        status ENUM('draft','pending','in_transit','received','cancelled') DEFAULT 'draft',
        notes TEXT,
        requested_by VARCHAR(100),
        approved_by VARCHAR(100) NULL,
        received_by VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        shipped_at TIMESTAMP NULL,
        received_at TIMESTAMP NULL,
        INDEX idx_transfer_clinic (clinic_id),
        INDEX idx_transfer_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
    CREATE TABLE IF NOT EXISTS pharmacy_stock_transfer_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transfer_id VARCHAR(50) NOT NULL,
        medication_id VARCHAR(50) NOT NULL,
        batch_id VARCHAR(50) NULL,
        quantity_sent INT NOT NULL,
        quantity_received INT NULL DEFAULT 0,
        FOREIGN KEY (transfer_id) REFERENCES pharmacy_stock_transfers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    echo "Phase 2 migration completed successfully.\n";

} catch (PDOException $e) {
    die("DB Error: " . $e->getMessage() . "\n");
}

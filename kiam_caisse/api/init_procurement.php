<?php
/**
 * Kiam ERP – Procurement Module
 * Initialisation des tables d'approvisionnement
 */
require_once __DIR__ . '/config.php';

try {
    // ── 1. SUPPLIERS (étendu vs erp_suppliers) ──────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (
        id           VARCHAR(50)  PRIMARY KEY,
        clinic_id    VARCHAR(50)  NOT NULL,
        name         VARCHAR(200) NOT NULL,
        contact_name VARCHAR(100),
        phone        VARCHAR(50),
        email        VARCHAR(100),
        address      TEXT,
        payment_terms VARCHAR(50) DEFAULT 'immediate',
        rating       ENUM('reliable','average','at_risk') DEFAULT 'average',
        notes        TEXT,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clinic (clinic_id)
    )");

    // Migration depuis erp_suppliers si elle existe
    try {
        $pdo->exec("INSERT IGNORE INTO suppliers (id, clinic_id, name, phone, email, address)
                    SELECT id, clinic_id, name, phone, email, address FROM erp_suppliers");
    } catch (Exception $e) { /* erp_suppliers peut ne pas exister */ }

    // ── 2. PURCHASE REQUESTS ────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_requests (
        id             VARCHAR(50) PRIMARY KEY,
        clinic_id      VARCHAR(50) NOT NULL,
        request_number VARCHAR(30),
        requested_by   VARCHAR(100),
        department     VARCHAR(100),
        urgency        ENUM('low','medium','high') DEFAULT 'medium',
        status         ENUM('pending','approved','rejected','converted') DEFAULT 'pending',
        notes          TEXT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clinic (clinic_id),
        INDEX idx_status (status)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_request_items (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        request_id      VARCHAR(50) NOT NULL,
        product_name    VARCHAR(200) NOT NULL,
        quantity        DECIMAL(15,3) NOT NULL DEFAULT 1,
        unit            VARCHAR(30) DEFAULT 'unité',
        estimated_price DECIMAL(15,2) DEFAULT 0,
        justification   TEXT,
        INDEX idx_request (request_id)
    )");

    // ── 3. PURCHASE ORDERS ──────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_orders (
        id            VARCHAR(50) PRIMARY KEY,
        clinic_id     VARCHAR(50) NOT NULL,
        order_number  VARCHAR(30),
        supplier_id   VARCHAR(50),
        request_id    VARCHAR(50),
        status        ENUM('draft','sent','confirmed','partially_received','received','cancelled') DEFAULT 'draft',
        total_ht      DECIMAL(15,2) DEFAULT 0,
        tax_rate      DECIMAL(5,2)  DEFAULT 0,
        total_ttc     DECIMAL(15,2) DEFAULT 0,
        expected_date DATE,
        notes         TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clinic  (clinic_id),
        INDEX idx_supplier(supplier_id),
        INDEX idx_status  (status)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_order_items (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        order_id     VARCHAR(50) NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        quantity     DECIMAL(15,3) NOT NULL DEFAULT 1,
        unit         VARCHAR(30) DEFAULT 'unité',
        unit_price   DECIMAL(15,2) DEFAULT 0,
        total_price  DECIMAL(15,2) DEFAULT 0,
        received_qty DECIMAL(15,3) DEFAULT 0,
        INDEX idx_order (order_id)
    )");

    // ── 4. GOODS RECEIPTS ───────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS goods_receipts (
        id             VARCHAR(50) PRIMARY KEY,
        clinic_id      VARCHAR(50) NOT NULL,
        receipt_number VARCHAR(30),
        order_id       VARCHAR(50) NOT NULL,
        status         ENUM('draft','validated') DEFAULT 'draft',
        notes          TEXT,
        received_by    VARCHAR(100),
        received_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        validated_at   TIMESTAMP NULL,
        INDEX idx_clinic (clinic_id),
        INDEX idx_order  (order_id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS goods_receipt_items (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        receipt_id    VARCHAR(50) NOT NULL,
        order_item_id INT,
        product_name  VARCHAR(200) NOT NULL,
        ordered_qty   DECIMAL(15,3) DEFAULT 0,
        received_qty  DECIMAL(15,3) DEFAULT 0,
        damaged_qty   DECIMAL(15,3) DEFAULT 0,
        notes         TEXT,
        INDEX idx_receipt (receipt_id)
    )");

    // ── 5. SUPPLIER INVOICES ────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS supplier_invoices (
        id             VARCHAR(50) PRIMARY KEY,
        clinic_id      VARCHAR(50) NOT NULL,
        invoice_number VARCHAR(50),
        supplier_id    VARCHAR(50) NOT NULL,
        order_id       VARCHAR(50),
        receipt_id     VARCHAR(50),
        amount_ht      DECIMAL(15,2) DEFAULT 0,
        tax_amount     DECIMAL(15,2) DEFAULT 0,
        total_ttc      DECIMAL(15,2) DEFAULT 0,
        paid_amount    DECIMAL(15,2) DEFAULT 0,
        status         ENUM('pending','validated','rejected','paid','partial') DEFAULT 'pending',
        due_date       DATE,
        notes          TEXT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clinic   (clinic_id),
        INDEX idx_supplier (supplier_id),
        INDEX idx_status   (status)
    )");

    // ── 6. SUPPLIER PAYMENTS ────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS supplier_payments (
        id             VARCHAR(50) PRIMARY KEY,
        clinic_id      VARCHAR(50) NOT NULL,
        invoice_id     VARCHAR(50) NOT NULL,
        supplier_id    VARCHAR(50) NOT NULL,
        amount         DECIMAL(15,2) NOT NULL,
        payment_method ENUM('cash','bank_transfer','check','mobile') DEFAULT 'cash',
        reference      VARCHAR(100),
        notes          TEXT,
        paid_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic   (clinic_id),
        INDEX idx_invoice  (invoice_id),
        INDEX idx_supplier (supplier_id)
    )");

    // ── 7. STOCK MOVEMENTS ──────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS stock_movements (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        clinic_id         VARCHAR(50) NOT NULL,
        product_name      VARCHAR(200),
        inventory_item_id VARCHAR(50),
        movement_type     ENUM('in','out','adjustment') DEFAULT 'in',
        quantity          DECIMAL(15,3) NOT NULL,
        reason            VARCHAR(200),
        reference_id      VARCHAR(50),
        reference_type    VARCHAR(50),
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic  (clinic_id),
        INDEX idx_item    (inventory_item_id)
    )");

    echo json_encode(["status" => "success", "message" => "Procurement tables initialized successfully"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>

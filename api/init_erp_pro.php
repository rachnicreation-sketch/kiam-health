<?php
require_once 'config.php';

try {
    // SUPPLIERS
    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_suppliers (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50),
        name VARCHAR(100),
        phone VARCHAR(50),
        email VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // CUSTOMERS
    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_customers (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50),
        name VARCHAR(100),
        phone VARCHAR(50),
        email VARCHAR(100),
        loyalty_points INT DEFAULT 0,
        debt_balance DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // EXPENSES
    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_expenses (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50),
        amount DECIMAL(15,2),
        category VARCHAR(50),
        description TEXT,
        date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // REGISTER CLOSINGS
    $pdo->exec("CREATE TABLE IF NOT EXISTS erp_register_closings (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50),
        user_id VARCHAR(50),
        opening_balance DECIMAL(15,2) DEFAULT 0,
        closing_balance DECIMAL(15,2) DEFAULT 0,
        expected_balance DECIMAL(15,2) DEFAULT 0,
        difference DECIMAL(15,2) DEFAULT 0,
        status ENUM('open', 'closed') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Modify transactions table to add customer_id if not exists
    try {
        $pdo->exec("ALTER TABLE transactions ADD COLUMN customer_id VARCHAR(50) AFTER clinic_id");
    } catch (Exception $e) { /* ignore if already exists */ }

    echo "ERP Pro tables initialized successfully!";
} catch (PDOException $e) {
    die("Error initializing ERP Pro tables: " . $e->getMessage());
}
?>

<?php
require_once 'config.php';

try {
    // HOTEL TABLES
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_rooms (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50),
        room_number VARCHAR(20),
        type VARCHAR(50),
        category VARCHAR(50),
        price DECIMAL(15,2),
        status ENUM('available', 'occupied', 'maintenance', 'cleaning') DEFAULT 'available',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_bookings (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50),
        room_id VARCHAR(50),
        customer_id VARCHAR(50),
        guest_name VARCHAR(100),
        guest_phone VARCHAR(50),
        check_in DATETIME,
        check_out DATETIME,
        total_amount DECIMAL(15,2),
        status ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // SCHOOL TABLES
    $pdo->exec("CREATE TABLE IF NOT EXISTS school_students (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50),
        name VARCHAR(100),
        first_name VARCHAR(100),
        class_level VARCHAR(50),
        tutor_name VARCHAR(100),
        tutor_phone VARCHAR(50),
        address TEXT,
        status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS school_grades (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50),
        student_id VARCHAR(50),
        subject VARCHAR(50),
        score DECIMAL(5,2),
        coefficient INT DEFAULT 1,
        period VARCHAR(50),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // ERP / INVENTORY
    $pdo->exec("CREATE TABLE IF NOT EXISTS inventory_items (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50),
        name VARCHAR(100),
        category VARCHAR(50),
        sku VARCHAR(50),
        stock DECIMAL(15,2) DEFAULT 0,
        unit VARCHAR(20),
        price_buy DECIMAL(15,2) DEFAULT 0,
        price_sell DECIMAL(15,2) DEFAULT 0,
        threshold DECIMAL(15,2) DEFAULT 5,
        warehouse VARCHAR(50) DEFAULT 'Main',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    echo "Phase 4 tables initialized successfully!";
} catch (PDOException $e) {
    die("Error initializing tables: " . $e->getMessage());
}
?>

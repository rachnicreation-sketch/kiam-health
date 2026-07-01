<?php
require_once 'config.php';

try {
    // 1. Activity Logs
    $pdo->exec("CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        user_id VARCHAR(50),
        action VARCHAR(255),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "Table activity_logs créée.\n";

    // 2. Student Documents
    $pdo->exec("CREATE TABLE IF NOT EXISTS school_student_docs (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        student_id VARCHAR(50),
        type VARCHAR(50),
        name VARCHAR(255),
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "Table school_student_docs créée.\n";

    // 3. User Documents (Staff)
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_docs (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        user_id VARCHAR(50),
        type VARCHAR(50),
        name VARCHAR(255),
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "Table user_docs créée.\n";

    // 4. School Schedule
    $pdo->exec("CREATE TABLE IF NOT EXISTS school_schedule (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        class_id VARCHAR(50),
        subject VARCHAR(100),
        teacher_name VARCHAR(255),
        room VARCHAR(50),
        day INT,
        start_time TIME,
        end_time TIME,
        color VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "Table school_schedule créée.\n";

    // 5. Inventory Movements
    $pdo->exec("CREATE TABLE IF NOT EXISTS inventory_movements (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        item_id VARCHAR(50),
        type ENUM('in', 'out', 'adj') DEFAULT 'adj',
        quantity FLOAT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "Table inventory_movements créée.\n";

} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage() . "\n";
}
?>

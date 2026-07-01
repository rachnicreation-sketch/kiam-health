<?php
require 'api/config.php';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "
    -- 1. System Audit Logs
    CREATE TABLE IF NOT EXISTS system_audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        record_id VARCHAR(100) NOT NULL,
        old_value JSON NULL,
        new_value JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic_audit (clinic_id),
        INDEX idx_user_audit (user_id),
        INDEX idx_table_record (table_name, record_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 2. Pharmacy Roles
    CREATE TABLE IF NOT EXISTS pharmacy_roles (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic_roles (clinic_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 3. Pharmacy Role Permissions
    CREATE TABLE IF NOT EXISTS pharmacy_role_permissions (
        role_id VARCHAR(50) NOT NULL,
        permission_key VARCHAR(100) NOT NULL,
        PRIMARY KEY (role_id, permission_key),
        FOREIGN KEY (role_id) REFERENCES pharmacy_roles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Update User Table (Add role_id)
    -- We assume kiam_users table exists and is used globally.
    -- We will just use the role_id column if needed, or add it if missing.
    -- To avoid breaking existing users, we'll alter if not exists (handled in PHP).

    -- 4. Pharmacy Registers (Multi-Caisses)
    CREATE TABLE IF NOT EXISTS pharmacy_registers (
        id VARCHAR(50) PRIMARY KEY,
        clinic_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        status ENUM('open', 'closed') DEFAULT 'closed',
        current_session_id VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic_registers (clinic_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $pdo->exec($sql);

    // Try to add register_id to pharmacy_cash_sessions
    try {
        $pdo->exec("ALTER TABLE pharmacy_cash_sessions ADD COLUMN register_id VARCHAR(50) NULL AFTER clinic_id");
        $pdo->exec("ALTER TABLE pharmacy_cash_sessions ADD INDEX idx_session_register (register_id)");
    } catch(Exception $e) {
        // Column might already exist
    }

    echo "Migration completed successfully.\n";

} catch (PDOException $e) {
    die("DB Error: " . $e->getMessage() . "\n");
}

<?php
require_once 'config.php';

try {
    // 1. SCHOOL CLASSES
    $pdo->exec("CREATE TABLE IF NOT EXISTS school_classes (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        name VARCHAR(100),
        level VARCHAR(50),
        teacher_id VARCHAR(50), -- Main teacher
        room_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 2. SCHOOL SUBJECTS
    $pdo->exec("CREATE TABLE IF NOT EXISTS school_subjects (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        name VARCHAR(100),
        coefficient INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 3. SCHOOL ATTENDANCE
    $pdo->exec("CREATE TABLE IF NOT EXISTS school_attendance (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        student_id VARCHAR(50),
        class_id VARCHAR(50),
        date DATE,
        status ENUM('present', 'absent', 'late', 'justified') DEFAULT 'present',
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 4. SCHOOL PAYMENTS
    $pdo->exec("CREATE TABLE IF NOT EXISTS school_payments (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        student_id VARCHAR(50),
        amount DECIMAL(15,2),
        payment_date DATE,
        type VARCHAR(50) DEFAULT 'Scolarité', -- Inscription, Mensualité, Examen
        status ENUM('paid', 'partial', 'pending') DEFAULT 'paid',
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 5. SCHOOL USERS META (Linking users to specific roles if needed)
    // For now, we'll use the main 'users' table but we need a way to link an 'eleve' user to a 'student_id'
    $pdo->exec("CREATE TABLE IF NOT EXISTS school_user_profiles (
        user_id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50),
        linked_id VARCHAR(50), -- student_id or teacher_id or parent_id
        profile_type ENUM('teacher', 'student', 'parent', 'staff')
    )");

    // Add class_id to school_students if not exists
    $stmt = $pdo->query("SHOW COLUMNS FROM school_students LIKE 'class_id'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE school_students ADD COLUMN class_id VARCHAR(50) AFTER clinic_id");
    }

    echo "School Phase 2 tables initialized successfully!";
} catch (PDOException $e) {
    die("Error initializing school tables: " . $e->getMessage());
}
?>

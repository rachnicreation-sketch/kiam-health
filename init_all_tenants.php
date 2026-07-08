<?php
/**
 * Script maître d'initialisation de toutes les bases de données tenants
 * Lance tous les scripts init_*.php pour chaque tenant
 */

$tenantConfigs = [
    'kiam_health'  => ['sector' => 'health',    'modules' => ['health', 'hr', 'pharmacy', 'procurement']],
    'kiam_hopital' => ['sector' => 'health',    'modules' => ['health', 'hr', 'pharmacy', 'procurement']],
    'kiam_ecole'   => ['sector' => 'school',    'modules' => ['school', 'hr', 'procurement']],
    'kiam_erp'     => ['sector' => 'erp',       'modules' => ['erp', 'hr', 'procurement']],
    'kiam_ges'     => ['sector' => 'erp',       'modules' => ['erp', 'hr', 'procurement']],
    'kiam_hotel'   => ['sector' => 'hotel',     'modules' => ['hotel', 'hr', 'procurement']],
    'kiam_caisse'  => ['sector' => 'pharmacy',  'modules' => ['pharmacy', 'hr', 'procurement']],
];

$apiDir = __DIR__ . '/api/';

foreach ($tenantConfigs as $dbName => $config) {
    echo "\n" . str_repeat('=', 60) . "\n";
    echo "🏢 Initialisation: {$dbName} [{$config['sector']}]\n";
    echo str_repeat('=', 60) . "\n";

    try {
        $pdo = new PDO("mysql:host=127.0.0.1;dbname={$dbName};charset=utf8mb4", 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);

        // ─── Tables de base (clinic, patients, employees, etc.) ───────────────
        runSQL($pdo, "CREATE TABLE IF NOT EXISTS clinics (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(200),
            sector VARCHAR(50) DEFAULT 'health',
            tenant_id VARCHAR(50),
            address TEXT,
            phone VARCHAR(50),
            email VARCHAR(100),
            logo_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "clinics");

        runSQL($pdo, "CREATE TABLE IF NOT EXISTS employees (
            id VARCHAR(50) PRIMARY KEY,
            clinic_id VARCHAR(50),
            name VARCHAR(200) NOT NULL,
            first_name VARCHAR(100),
            email VARCHAR(150),
            phone VARCHAR(30),
            position VARCHAR(100),
            department VARCHAR(100),
            contract_type ENUM('CDI','CDD','Stage','Vacataire','Consultant') DEFAULT 'CDI',
            base_salary DECIMAL(15,2) DEFAULT 0,
            gender ENUM('M','F') DEFAULT 'M',
            birth_date DATE,
            hire_date DATE,
            status ENUM('active','inactive','suspended') DEFAULT 'active',
            photo_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "employees");

        runSQL($pdo, "CREATE TABLE IF NOT EXISTS payrolls (
            id VARCHAR(50) PRIMARY KEY,
            clinic_id VARCHAR(50),
            employee_id VARCHAR(50),
            period_month INT,
            period_year INT,
            base_salary DECIMAL(15,2),
            gross_salary DECIMAL(15,2),
            net_salary DECIMAL(15,2),
            status ENUM('draft','validated','paid') DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "payrolls");

        runSQL($pdo, "CREATE TABLE IF NOT EXISTS payroll_items (
            id VARCHAR(50) PRIMARY KEY,
            payroll_id VARCHAR(50),
            label VARCHAR(200),
            type ENUM('earning','deduction'),
            amount DECIMAL(15,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "payroll_items");

        runSQL($pdo, "CREATE TABLE IF NOT EXISTS invoices (
            id VARCHAR(50) PRIMARY KEY,
            clinic_id VARCHAR(50),
            patient_id VARCHAR(50),
            invoice_number VARCHAR(50),
            total_amount DECIMAL(15,2),
            paid_amount DECIMAL(15,2) DEFAULT 0,
            status ENUM('draft','sent','paid','cancelled') DEFAULT 'draft',
            due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "invoices");

        runSQL($pdo, "CREATE TABLE IF NOT EXISTS invoice_items (
            id VARCHAR(50) PRIMARY KEY,
            invoice_id VARCHAR(50),
            label VARCHAR(200),
            quantity INT DEFAULT 1,
            unit_price DECIMAL(15,2),
            total DECIMAL(15,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "invoice_items");

        runSQL($pdo, "CREATE TABLE IF NOT EXISTS ohada_accounts (
            id VARCHAR(50) PRIMARY KEY,
            clinic_id VARCHAR(50),
            code VARCHAR(20) NOT NULL,
            label VARCHAR(200) NOT NULL,
            account_type ENUM('asset','liability','equity','revenue','expense') NOT NULL,
            balance DECIMAL(15,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "ohada_accounts");

        runSQL($pdo, "CREATE TABLE IF NOT EXISTS ohada_journal_entries (
            id VARCHAR(50) PRIMARY KEY,
            clinic_id VARCHAR(50),
            entry_number VARCHAR(50),
            description TEXT,
            entry_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "ohada_journal_entries");

        runSQL($pdo, "CREATE TABLE IF NOT EXISTS ohada_journal_lines (
            id VARCHAR(50) PRIMARY KEY,
            entry_id VARCHAR(50),
            account_id VARCHAR(50),
            debit DECIMAL(15,2) DEFAULT 0,
            credit DECIMAL(15,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "ohada_journal_lines");

        runSQL($pdo, "CREATE TABLE IF NOT EXISTS transactions (
            id VARCHAR(50) PRIMARY KEY,
            clinic_id VARCHAR(50),
            type ENUM('income','expense','transfer') DEFAULT 'income',
            amount DECIMAL(15,2),
            description TEXT,
            reference VARCHAR(100),
            transaction_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "transactions");

        runSQL($pdo, "CREATE TABLE IF NOT EXISTS branches (
            id VARCHAR(50) PRIMARY KEY,
            clinic_id VARCHAR(50),
            name VARCHAR(200),
            address TEXT,
            phone VARCHAR(50),
            is_main TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )", "branches");

        // ─── Health / Hospital specific ───────────────────────────────────────
        if (in_array('health', $config['modules'])) {
            runSQL($pdo, "CREATE TABLE IF NOT EXISTS patients (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                name VARCHAR(200) NOT NULL,
                first_name VARCHAR(100),
                gender ENUM('M','F','Autre') DEFAULT 'M',
                birth_date DATE,
                blood_type VARCHAR(5),
                phone VARCHAR(30),
                address TEXT,
                patient_number VARCHAR(50),
                emergency_contact VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "patients");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS consultations (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                patient_id VARCHAR(50),
                employee_id VARCHAR(50),
                symptoms TEXT,
                diagnosis TEXT,
                prescription TEXT,
                consultation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('pending','completed','cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "consultations");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS appointments (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                patient_id VARCHAR(50),
                employee_id VARCHAR(50),
                appointment_date DATETIME,
                reason TEXT,
                status ENUM('scheduled','confirmed','completed','cancelled') DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "appointments");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS admissions (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                patient_id VARCHAR(50),
                bed_id VARCHAR(50),
                admission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                discharge_date DATETIME,
                diagnosis TEXT,
                status ENUM('admitted','discharged','transferred') DEFAULT 'admitted',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "admissions");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS beds (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                room_number VARCHAR(20),
                ward VARCHAR(100),
                status ENUM('available','occupied','maintenance') DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "beds");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS medical_acts (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                name VARCHAR(200),
                price DECIMAL(15,2),
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "medical_acts");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS lab_services (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                name VARCHAR(200),
                price DECIMAL(15,2),
                unit VARCHAR(50),
                reference_range VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "lab_services");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS lab_tests (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                patient_id VARCHAR(50),
                service_id VARCHAR(50),
                result TEXT,
                test_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('pending','in_progress','completed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "lab_tests");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS medications (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                name VARCHAR(200) NOT NULL,
                generic_name VARCHAR(200),
                form VARCHAR(100),
                dosage VARCHAR(100),
                stock_quantity INT DEFAULT 0,
                min_stock INT DEFAULT 5,
                unit_price DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "medications");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS pharmacy_sales (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                patient_id VARCHAR(50),
                total_amount DECIMAL(15,2),
                sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('completed','cancelled') DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "pharmacy_sales");
        }

        // ─── School specific ──────────────────────────────────────────────────
        if (in_array('school', $config['modules'])) {
            runSQL($pdo, "CREATE TABLE IF NOT EXISTS school_students (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                name VARCHAR(200) NOT NULL,
                first_name VARCHAR(100),
                class_level VARCHAR(50),
                tutor_name VARCHAR(100),
                tutor_phone VARCHAR(50),
                address TEXT,
                status ENUM('active','inactive','graduated') DEFAULT 'active',
                registration_number VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "school_students");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS school_grades (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                student_id VARCHAR(50),
                subject VARCHAR(100),
                grade DECIMAL(5,2),
                max_grade DECIMAL(5,2) DEFAULT 20,
                period VARCHAR(50),
                academic_year VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "school_grades");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS school_schedule (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                class_level VARCHAR(50),
                subject VARCHAR(100),
                teacher_id VARCHAR(50),
                day_of_week INT,
                start_time TIME,
                end_time TIME,
                room VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "school_schedule");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS school_student_docs (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                student_id VARCHAR(50),
                doc_type VARCHAR(100),
                file_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "school_student_docs");
        }

        // ─── ERP / Commerce specific ──────────────────────────────────────────
        if (in_array('erp', $config['modules'])) {
            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_customers (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                name VARCHAR(200) NOT NULL,
                phone VARCHAR(50),
                email VARCHAR(150),
                address TEXT,
                customer_type ENUM('individual','company') DEFAULT 'individual',
                credit_limit DECIMAL(15,2) DEFAULT 0,
                balance DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_customers");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_suppliers (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                name VARCHAR(200) NOT NULL,
                phone VARCHAR(50),
                email VARCHAR(150),
                address TEXT,
                tax_number VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_suppliers");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_quotes (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                customer_id VARCHAR(50),
                quote_number VARCHAR(50),
                total_amount DECIMAL(15,2),
                status ENUM('draft','sent','accepted','rejected','expired') DEFAULT 'draft',
                valid_until DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_quotes");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_quote_items (
                id VARCHAR(50) PRIMARY KEY,
                quote_id VARCHAR(50),
                article_id VARCHAR(50),
                label VARCHAR(200),
                quantity INT DEFAULT 1,
                unit_price DECIMAL(15,2),
                total DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_quote_items");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_delivery_slips (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                customer_id VARCHAR(50),
                slip_number VARCHAR(50),
                delivery_date DATE,
                status ENUM('prepared','shipped','delivered') DEFAULT 'prepared',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_delivery_slips");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_delivery_slip_items (
                id VARCHAR(50) PRIMARY KEY,
                slip_id VARCHAR(50),
                article_id VARCHAR(50),
                label VARCHAR(200),
                quantity INT DEFAULT 1,
                unit_price DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_delivery_slip_items");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_expenses (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                category VARCHAR(100),
                description TEXT,
                amount DECIMAL(15,2),
                expense_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_expenses");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_register_closings (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                opening_amount DECIMAL(15,2),
                closing_amount DECIMAL(15,2),
                total_sales DECIMAL(15,2),
                closing_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_register_closings");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_physical_inventories (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                reference VARCHAR(50),
                status ENUM('in_progress','completed') DEFAULT 'in_progress',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_physical_inventories");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_physical_inventory_items (
                id VARCHAR(50) PRIMARY KEY,
                inventory_id VARCHAR(50),
                article_id VARCHAR(50),
                expected_qty INT DEFAULT 0,
                counted_qty INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_physical_inventory_items");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS erp_product_units (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                name VARCHAR(50) NOT NULL,
                abbreviation VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "erp_product_units");
        }

        // ─── Hotel specific ───────────────────────────────────────────────────
        if (in_array('hotel', $config['modules'])) {
            runSQL($pdo, "CREATE TABLE IF NOT EXISTS hotel_rooms (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                room_number VARCHAR(20),
                type VARCHAR(50),
                category VARCHAR(50),
                price DECIMAL(15,2),
                status ENUM('available','occupied','maintenance','cleaning') DEFAULT 'available',
                floor_number INT DEFAULT 0,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "hotel_rooms");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS hotel_bookings (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                room_id VARCHAR(50),
                guest_name VARCHAR(200),
                guest_phone VARCHAR(50),
                guest_email VARCHAR(150),
                check_in DATETIME,
                check_out DATETIME,
                total_amount DECIMAL(15,2),
                paid_amount DECIMAL(15,2) DEFAULT 0,
                status ENUM('confirmed','checked_in','checked_out','cancelled') DEFAULT 'confirmed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "hotel_bookings");
        }

        // ─── Pharmacy / Caisse ────────────────────────────────────────────────
        if (in_array('pharmacy', $config['modules'])) {
            runSQL($pdo, "CREATE TABLE IF NOT EXISTS medications (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                name VARCHAR(200) NOT NULL,
                generic_name VARCHAR(200),
                form VARCHAR(100),
                dosage VARCHAR(100),
                stock_quantity INT DEFAULT 0,
                min_stock INT DEFAULT 5,
                unit_price DECIMAL(15,2) DEFAULT 0,
                sell_price DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "medications");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS medication_batches (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                medication_id VARCHAR(50),
                batch_number VARCHAR(100),
                expiry_date DATE,
                quantity INT DEFAULT 0,
                purchase_price DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "medication_batches");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS pharmacy_customers (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                name VARCHAR(200),
                phone VARCHAR(50),
                email VARCHAR(150),
                credit_balance DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "pharmacy_customers");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS pharmacy_cash_sessions (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                opened_at DATETIME,
                closed_at DATETIME,
                opening_amount DECIMAL(15,2),
                closing_amount DECIMAL(15,2),
                status ENUM('open','closed') DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "pharmacy_cash_sessions");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS pharmacy_sales (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                customer_id VARCHAR(50),
                session_id VARCHAR(50),
                total_amount DECIMAL(15,2),
                paid_amount DECIMAL(15,2),
                sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('completed','cancelled') DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "pharmacy_sales");
        }

        // ─── Procurement (common) ─────────────────────────────────────────────
        if (in_array('procurement', $config['modules'])) {
            // suppliers & purchase_orders already exist from Laravel migrations
            // Just ensure inventory_items exists
            runSQL($pdo, "CREATE TABLE IF NOT EXISTS inventory_items (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                inventory_id VARCHAR(50),
                article_id VARCHAR(50),
                expected_qty INT DEFAULT 0,
                counted_qty INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "inventory_items");

            runSQL($pdo, "CREATE TABLE IF NOT EXISTS inventory_movements (
                id VARCHAR(50) PRIMARY KEY,
                clinic_id VARCHAR(50),
                article_id VARCHAR(50),
                movement_type ENUM('in','out','adjustment','transfer') DEFAULT 'in',
                quantity INT DEFAULT 0,
                unit_price DECIMAL(15,2),
                reference VARCHAR(100),
                movement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", "inventory_movements");
        }

        echo "\n✅ {$dbName} — Initialisation terminée!\n";

    } catch (Exception $e) {
        echo "\n❌ {$dbName} — Erreur: " . $e->getMessage() . "\n";
    }
}

echo "\n" . str_repeat('=', 60) . "\n";
echo "✅ Toutes les bases de données ont été initialisées!\n";
echo str_repeat('=', 60) . "\n";

function runSQL(PDO $pdo, string $sql, string $label): void {
    try {
        $pdo->exec($sql);
        echo "  ✓ Table créée/vérifiée: {$label}\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  ○ Table déjà existante: {$label}\n";
        } else {
            echo "  ✗ Erreur {$label}: " . $e->getMessage() . "\n";
        }
    }
}

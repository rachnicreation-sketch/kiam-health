-- SQL Schema for Kiam Health SaaS
-- Created for WampServer (MySQL)

CREATE DATABASE IF NOT EXISTS kiam_health;
USE kiam_health;

-- 1. Clinics
CREATE TABLE IF NOT EXISTS clinics (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status ENUM('active', 'blocked') DEFAULT 'active',
    logo TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(255),
    tax_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Branches (Establishments)
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    type ENUM('headquarters', 'branch', 'department') DEFAULT 'branch',
    address TEXT,
    phone VARCHAR(50),
    manager VARCHAR(255),
    status ENUM('open', 'closed') DEFAULT 'open',
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('saas_admin', 'clinic_admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'receptionist', 'medical_secretary', 'hr', 'inventory_manager', 'nurse_aide', 'agent') NOT NULL,
    clinic_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Patients
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    age INT,
    dob DATE,
    gender ENUM('M', 'F') NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    id_number VARCHAR(100),
    blood_group VARCHAR(10),
    assurance VARCHAR(255),
    emergency_name VARCHAR(255),
    emergency_phone VARCHAR(50),
    allergies TEXT,
    medical_history TEXT,
    status VARCHAR(50) DEFAULT 'Actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    type VARCHAR(100),
    status ENUM('pending', 'confirmed', 'cancelled', 'attended') DEFAULT 'pending',
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Consultations
CREATE TABLE IF NOT EXISTS consultations (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    consultation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    symptoms TEXT,
    temp VARCHAR(20),
    bp VARCHAR(20),
    weight VARCHAR(20),
    hr VARCHAR(20),
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    status ENUM('pending', 'completed') DEFAULT 'completed',
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Invoices & Items
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status ENUM('paid', 'pending', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('cash', 'card', 'transfer'),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Laboratory
CREATE TABLE IF NOT EXISTS lab_tests (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    result TEXT,
    unit VARCHAR(50),
    normative_value VARCHAR(100),
    status ENUM('pending', 'completed') DEFAULT 'pending',
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Medical Services Catalog
CREATE TABLE IF NOT EXISTS medical_acts (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    price DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_services (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    testName VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    price DECIMAL(15, 2) NOT NULL,
    unit VARCHAR(50),
    normativeValue VARCHAR(100),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Accounting
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(255),
    transaction_date DATE NOT NULL,
    description TEXT,
    payment_method VARCHAR(50),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Hospitalization
CREATE TABLE IF NOT EXISTS beds (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    ward VARCHAR(100),
    room VARCHAR(50),
    bed_num VARCHAR(20),
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admissions (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    bed_id VARCHAR(50),
    date_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_out DATETIME,
    reason TEXT,
    status ENUM('active', 'discharged') DEFAULT 'active',
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bed_transfers (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    admission_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    old_bed_info VARCHAR(255),
    new_bed_info VARCHAR(255),
    transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (admission_id) REFERENCES admissions(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Pharmacy
CREATE TABLE IF NOT EXISTS medications (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    stock INT DEFAULT 0,
    unit VARCHAR(50),
    threshold INT DEFAULT 5,
    price DECIMAL(15, 2),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pharmacy_sales (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    medication_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(255),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. HR & Payroll
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    department VARCHAR(100),
    position VARCHAR(100),
    base_salary DECIMAL(15, 2),
    hire_date DATE,
    status ENUM('active', 'on_leave', 'terminated') DEFAULT 'active',
    cnss_number VARCHAR(100),
    bank_account VARCHAR(100),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payrolls (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    month VARCHAR(20),
    base_salary DECIMAL(15, 2),
    net_salary DECIMAL(15, 2),
    status ENUM('draft', 'paid') DEFAULT 'draft',
    payment_date DATE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payroll_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_id VARCHAR(50) NOT NULL,
    type ENUM('bonus', 'deduction') NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (payroll_id) REFERENCES payrolls(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Planning
CREATE TABLE IF NOT EXISTS guards (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    guard_date DATE NOT NULL,
    quart ENUM('morning', 'afternoon', 'night') NOT NULL,
    service_id VARCHAR(50),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DATA (REMAINING)
INSERT INTO medical_acts (id, clinic_id, name, category, price) VALUES 
('ACT-001', 'c1', 'Consultation Générale', 'Consultation', 15000),
('ACT-002', 'c1', 'Consultation Spécialisée', 'Consultation', 25000),
('ACT-003', 'c1', 'Pansement Simple', 'Soins', 5000);

INSERT INTO lab_services (id, clinic_id, testName, category, price, unit, normativeValue) VALUES 
('LAB-001', 'c1', 'Hémogramme (NFS)', 'Hématologie', 8500, 'g/dL', '12-16'),
('LAB-002', 'c1', 'Glycémie à jeun', 'Biochimie', 3500, 'g/L', '0.7-1.1');

INSERT INTO beds (id, clinic_id, ward, room, bed_num, status) VALUES 
('B1-01', 'c1', 'Pédiatrie', '101', '1', 'available'),
('B1-02', 'c1', 'Pédiatrie', '101', '2', 'available');

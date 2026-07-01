-- Schema SQL pour KIAM Caisse
-- Version 1.0

CREATE DATABASE IF NOT EXISTS `kiam_caisse` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kiam_caisse`;

-- 1. Table des Paramètres de l'entreprise
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_name` VARCHAR(100) NOT NULL,
    `company_logo` VARCHAR(255) NULL,
    `company_phone` VARCHAR(30) NULL,
    `company_email` VARCHAR(100) NULL,
    `company_address` TEXT NULL,
    `currency` VARCHAR(10) DEFAULT 'FCFA',
    `tax_rate` DECIMAL(5,2) DEFAULT 18.00, -- TVA par défaut à 18% (Sénégal/UEMOA)
    `printer_config` VARCHAR(100) DEFAULT '80mm_thermal',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table des Utilisateurs
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'manager', 'cashier', 'rh', 'comptable') NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_login` TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

-- 3. Table des Catégories de produits
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
        `description` TEXT NULL,
    `user_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. Table des Produits
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `barcode` VARCHAR(50) NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `category_id` INT NULL,
    `purchase_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `sale_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `stock_qty` INT NOT NULL DEFAULT 0,
    `min_stock_alert` INT NOT NULL DEFAULT 5,
    `image_path` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. Table des Clients
CREATE TABLE IF NOT EXISTS `clients` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(100) NULL,
    `address` TEXT NULL,
    `loyalty_points` INT DEFAULT 0,
    `balance` DECIMAL(12,2) DEFAULT 0.00, -- Solde du client (pour les crédits/dettes)
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Table des Fournisseurs
CREATE TABLE IF NOT EXISTS `suppliers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(100) NULL,
    `address` TEXT NULL,
    `company_name` VARCHAR(100) NULL,
    `outstanding_debt` DECIMAL(12,2) DEFAULT 0.00, -- Dette due à ce fournisseur
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Table des Commandes d'achats Fournisseurs
CREATE TABLE IF NOT EXISTS `supplier_orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `supplier_id` INT NOT NULL,
    `order_date` DATE NOT NULL,
    `total_amount` DECIMAL(12,2) NOT NULL,
    `payment_status` ENUM('paid', 'partially_paid', 'unpaid') DEFAULT 'unpaid',
    `amount_paid` DECIMAL(12,2) DEFAULT 0.00,
    `status` ENUM('ordered', 'received', 'cancelled') DEFAULT 'ordered',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. Détails des Commandes d'achats Fournisseurs
CREATE TABLE IF NOT EXISTS `supplier_order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (`order_id`) REFERENCES `supplier_orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 9. Table des Sessions de Caisse (Ouverture / Clôture)
CREATE TABLE IF NOT EXISTS `cash_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `opened_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `closed_at` TIMESTAMP NULL DEFAULT NULL,
    `opening_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `expected_closing_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `actual_closing_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `difference` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('open', 'closed') DEFAULT 'open',
    `notes` TEXT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 10. Table des Ventes (Sales)
CREATE TABLE IF NOT EXISTS `sales` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `invoice_no` VARCHAR(50) NOT NULL UNIQUE,
    `user_id` INT NOT NULL,
    `client_id` INT NOT NULL,
    `session_id` INT NULL,
    `sale_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `total_amount` DECIMAL(12,2) NOT NULL, -- Total Brut (sans taxes, sans reduc)
    `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `css_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `net_amount` DECIMAL(12,2) NOT NULL, -- Total net payé = (total - discount) + tax + css
    `payment_method` ENUM('cash', 'mobile_money', 'card', 'split') DEFAULT 'cash',
    `amount_paid` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `change_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('completed', 'cancelled') DEFAULT 'completed',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`session_id`) REFERENCES `cash_sessions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. Détails des ventes (Articles vendus)
CREATE TABLE IF NOT EXISTS `sale_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sale_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(12,2) NOT NULL,
    `subtotal` DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 12. Historique des Mouvements de stock
CREATE TABLE IF NOT EXISTS `stock_movements` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `type` ENUM('in', 'out', 'adjustment') NOT NULL, -- in: entrée (achats), out: sortie (ventes), adjustment: inventaire manuel
    `quantity` INT NOT NULL,
    `reference_id` INT NULL, -- ID de la vente ou de la commande fournisseur si applicable
    `notes` TEXT NULL,
    `user_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 13. Gestion des Dépenses
CREATE TABLE IF NOT EXISTS `expenses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `title` VARCHAR(150) NOT NULL,
    `category` ENUM('rent', 'utilities', 'salaries', 'transport', 'other') DEFAULT 'other',
    `amount` DECIMAL(12,2) NOT NULL,
    `expense_date` DATE NOT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 14. Table d'audit (Historique de connexions / actions)
CREATE TABLE IF NOT EXISTS `user_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `action` TEXT NOT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Table des Employés
CREATE TABLE IF NOT EXISTS `employees` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `matricule` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `gender` ENUM('M', 'F') DEFAULT 'M',
    `birth_date` DATE NULL,
    `id_type` VARCHAR(50) DEFAULT 'CNI',
    `id_number` VARCHAR(100) NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(100) NULL,
    `job_title` VARCHAR(100) NULL,
    `department` VARCHAR(100) DEFAULT 'Général',
    `contract_type` VARCHAR(50) DEFAULT 'CDI',
    `hire_date` DATE NULL,
    `base_salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `work_basis` ENUM('hourly', 'daily', 'monthly') DEFAULT 'monthly',
    `hours_per_day` INT DEFAULT 8,
    `cnss_enabled` TINYINT(1) DEFAULT 0,
    `cnss_number` VARCHAR(100) NULL,
    `bank_name` VARCHAR(100) NULL,
    `bank_account` VARCHAR(100) NULL,
    `photo_path` VARCHAR(255) NULL,
    `status` ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    `emergency_contact_name` VARCHAR(100) NULL,
    `emergency_contact_phone` VARCHAR(30) NULL,
    `emergency_contact_relation` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 16. Table de Pointage et Heures de Travail
CREATE TABLE IF NOT EXISTS `attendance` (
    `employee_id` INT NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('present', 'absent', 'late', 'leave', 'holiday') DEFAULT 'present',
    `check_in` TIME NULL,
    `check_out` TIME NULL,
    `hours_worked` DECIMAL(5,2) DEFAULT 0.00,
    `overtime_hours` DECIMAL(5,2) DEFAULT 0.00,
    `night_hours` DECIMAL(5,2) DEFAULT 0.00,
    `validated_by` INT NULL,
    PRIMARY KEY (`employee_id`, `date`),
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`validated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 17. Table des Avances sur Salaire
CREATE TABLE IF NOT EXISTS `advances` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `amount` DECIMAL(12,2) NOT NULL,
    `repaid_amount` DECIMAL(12,2) DEFAULT 0.00,
    `request_date` DATE NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 18. Table des Primes & Bonus
CREATE TABLE IF NOT EXISTS `primes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `type` VARCHAR(50) DEFAULT 'rendement',
    `amount` DECIMAL(12,2) NOT NULL,
    `date_assigned` DATE NOT NULL,
    `status` ENUM('pending', 'paid') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 19. Table des Bulletins de Paie
CREATE TABLE IF NOT EXISTS `payslips` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bulletin_code` VARCHAR(50) NOT NULL UNIQUE,
    `employee_id` INT NOT NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `base_salary` DECIMAL(12,2) NOT NULL,
    `days_worked` INT DEFAULT 0,
    `hours_worked` DECIMAL(8,2) DEFAULT 0.00,
    `overtime_amount` DECIMAL(12,2) DEFAULT 0.00,
    `night_work_amount` DECIMAL(12,2) DEFAULT 0.00,
    `primes_amount` DECIMAL(12,2) DEFAULT 0.00,
    `gross_salary` DECIMAL(12,2) NOT NULL,
    `cnss_deduction` DECIMAL(12,2) DEFAULT 0.00,
    `tax_deduction` DECIMAL(12,2) DEFAULT 0.00,
    `advances_deduction` DECIMAL(12,2) DEFAULT 0.00,
    `net_salary` DECIMAL(12,2) NOT NULL,
    `payment_status` ENUM('pending', 'paid') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_emp_period` (`employee_id`, `period_start`, `period_end`),
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 20. Table de Paramétrage de la Paie
CREATE TABLE IF NOT EXISTS `payroll_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `cnss_rate_employee` DECIMAL(5,2) NOT NULL DEFAULT 5.50,
    `cnss_rate_employer` DECIMAL(5,2) NOT NULL DEFAULT 14.50,
    `tax_bracket_rate` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    `work_start_time` TIME NOT NULL DEFAULT '08:00:00',
    `work_end_time` TIME NOT NULL DEFAULT '17:00:00',
    `weekend_days` VARCHAR(100) NOT NULL DEFAULT 'Saturday,Sunday',
    `overtime_rate_multiplier` DECIMAL(5,2) NOT NULL DEFAULT 1.25,
    `night_work_multiplier` DECIMAL(5,2) NOT NULL DEFAULT 1.50,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 21. Table des Paiements Clients
CREATE TABLE IF NOT EXISTS `client_payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `client_id` INT NOT NULL,
    `amount` DECIMAL(12,2) NOT NULL,
    `payment_date` DATE NOT NULL,
    `payment_method` VARCHAR(50) DEFAULT 'cash',
    `notes` TEXT NULL,
    `recorded_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

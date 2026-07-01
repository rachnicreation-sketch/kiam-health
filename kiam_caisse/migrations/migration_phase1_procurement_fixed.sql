-- ================================================================
-- PHASE 1 PROCUREMENT - Migration SQL (CORRIGÉE)
-- Gestion Complète des Fournisseurs
-- Date: 2026-05-25
-- ================================================================

USE `kiam_caisse`;

-- ================================================================
-- 1. ALTER TABLE suppliers - Enrichissement des données
-- ================================================================
ALTER TABLE `suppliers` 
ADD COLUMN `rccm` VARCHAR(100) NULL COMMENT 'Registre du Commerce et du Crédit Mobilier' AFTER `company_name`,
ADD COLUMN `niu` VARCHAR(100) NULL COMMENT 'Numéro d\'Identification Unique (Fiscal)' AFTER `rccm`,
ADD COLUMN `delivery_lead_time_days` INT DEFAULT 5 COMMENT 'Délai moyen de livraison en jours' AFTER `niu`,
ADD COLUMN `payment_terms` ENUM('immediate', 'net_7', 'net_15', 'net_30', 'net_60', 'consignment') DEFAULT 'net_30' COMMENT 'Conditions de paiement' AFTER `delivery_lead_time_days`,
ADD COLUMN `payment_method` VARCHAR(100) NULL COMMENT 'Moyens de paiement acceptés (virement,chèque,espèces,etc)' AFTER `payment_terms`,
ADD COLUMN `status` ENUM('active', 'inactive', 'suspended', 'archived') DEFAULT 'active' AFTER `payment_method`,
ADD COLUMN `rating` DECIMAL(3,2) DEFAULT 0 COMMENT 'Notation fournisseur de 0 à 5' AFTER `status`,
ADD COLUMN `total_purchases` DECIMAL(12,2) DEFAULT 0 COMMENT 'Montant total des achats' AFTER `rating`,
ADD COLUMN `last_purchase_date` DATE NULL COMMENT 'Date du dernier achat' AFTER `total_purchases`,
ADD COLUMN `contact_person` VARCHAR(100) NULL AFTER `last_purchase_date`,
ADD COLUMN `website` VARCHAR(255) NULL AFTER `contact_person`,
ADD COLUMN `notes` TEXT NULL AFTER `website`,
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- ================================================================
-- 2. CREATE TABLE supplier_contacts
-- ================================================================
CREATE TABLE IF NOT EXISTS `supplier_contacts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `supplier_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `title` VARCHAR(100) NULL COMMENT 'Titre/Fonction (Directeur, Responsable Achat, etc)',
    `phone` VARCHAR(30) NOT NULL,
    `email` VARCHAR(100) NULL,
    `mobile` VARCHAR(30) NULL,
    `fax` VARCHAR(30) NULL,
    `is_primary` BOOLEAN DEFAULT FALSE COMMENT 'Contact principal',
    `is_active` BOOLEAN DEFAULT TRUE,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_supplier_id` (`supplier_id`),
    INDEX `idx_is_primary` (`is_primary`)
) ENGINE=InnoDB COMMENT='Contacts multiples par fournisseur';

-- ================================================================
-- 3. CREATE TABLE supplier_products
-- ================================================================
CREATE TABLE IF NOT EXISTS `supplier_products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `supplier_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `supplier_sku` VARCHAR(100) NULL COMMENT 'SKU du fournisseur (peut différer du nôtre)',
    `supplier_barcode` VARCHAR(100) NULL COMMENT 'Code-barres du fournisseur',
    `purchase_price` DECIMAL(12,2) NOT NULL COMMENT 'Prix d\'achat auprès de ce fournisseur',
    `minimum_order_qty` INT DEFAULT 1 COMMENT 'Quantité minimale de commande',
    `pack_qty` INT DEFAULT 1 COMMENT 'Conditionnement (ex: 12 unités par boîte)',
    `lead_time_days` INT DEFAULT 0 COMMENT 'Délai spécifique pour ce produit',
    `is_preferred` BOOLEAN DEFAULT FALSE COMMENT 'Fournisseur préféré pour ce produit',
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_price_update` DATE NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `unique_supplier_product` (`supplier_id`, `product_id`),
    INDEX `idx_supplier_id` (`supplier_id`),
    INDEX `idx_product_id` (`product_id`),
    INDEX `idx_is_preferred` (`is_preferred`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB COMMENT='Produits disponibles par fournisseur avec tarification';

-- ================================================================
-- 4. CREATE TABLE supplier_price_history
-- ================================================================
CREATE TABLE IF NOT EXISTS `supplier_price_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `supplier_product_id` INT NOT NULL,
    `old_price` DECIMAL(12,2) NOT NULL,
    `new_price` DECIMAL(12,2) NOT NULL,
    `price_change_percent` DECIMAL(5,2) GENERATED ALWAYS AS (((new_price - old_price) / old_price) * 100) STORED,
    `reason` VARCHAR(255) NULL COMMENT 'Raison du changement de prix',
    `changed_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`supplier_product_id`) REFERENCES `supplier_products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_supplier_product_id` (`supplier_product_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB COMMENT='Historique des variations de prix par fournisseur';

-- ================================================================
-- 5. CREATE TABLE supplier_performance
-- ================================================================
CREATE TABLE IF NOT EXISTS `supplier_performance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `supplier_id` INT NOT NULL UNIQUE,
    `total_orders` INT DEFAULT 0,
    `on_time_delivery_percent` DECIMAL(5,2) DEFAULT 0,
    `order_accuracy_percent` DECIMAL(5,2) DEFAULT 0,
    `quality_rating` DECIMAL(3,2) DEFAULT 0,
    `response_time_hours` DECIMAL(8,2) DEFAULT 0,
    `total_amount_purchased` DECIMAL(12,2) DEFAULT 0,
    `average_order_value` DECIMAL(12,2) DEFAULT 0,
    `disputes_count` INT DEFAULT 0,
    `returns_count` INT DEFAULT 0,
    `last_calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Indicateurs de performance par fournisseur';

-- ================================================================
-- 6. CREATE TABLE warehouses
-- ================================================================
CREATE TABLE IF NOT EXISTS `warehouses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(255) NULL,
    `manager_id` INT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY `unique_name` (`name`)
) ENGINE=InnoDB COMMENT='Dépôts/Entrepôts';

-- ================================================================
-- 7. CREATE TABLE stores
-- ================================================================
CREATE TABLE IF NOT EXISTS `stores` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(255) NULL,
    `manager_id` INT NULL,
    `warehouse_id` INT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY `unique_name` (`name`)
) ENGINE=InnoDB COMMENT='Points de vente/Magasins';

-- ================================================================
-- 8. ALTER TABLE supplier_orders - Améliorations
-- ================================================================
ALTER TABLE `supplier_orders`
ADD COLUMN IF NOT EXISTS `user_id` INT NULL COMMENT 'Utilisateur qui a créé la commande' AFTER `supplier_id`,
ADD COLUMN IF NOT EXISTS `reference` VARCHAR(100) NULL UNIQUE COMMENT 'Référence interne' AFTER `user_id`,
ADD COLUMN IF NOT EXISTS `expected_delivery_date` DATE NULL AFTER `reference`,
ADD COLUMN IF NOT EXISTS `actual_delivery_date` DATE NULL AFTER `expected_delivery_date`,
ADD COLUMN IF NOT EXISTS `notes` TEXT NULL AFTER `actual_delivery_date`,
ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Ajouter la clé étrangère si elle n'existe pas
ALTER TABLE `supplier_orders`
ADD FOREIGN KEY IF NOT EXISTS `fk_supplier_orders_user` (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Ajouter les index
ALTER TABLE `supplier_orders`
ADD INDEX IF NOT EXISTS `idx_reference` (`reference`),
ADD INDEX IF NOT EXISTS `idx_status` (`status`);

-- ================================================================
-- 9. ALTER TABLE stock_movements - Enrichissement
-- ================================================================
ALTER TABLE `stock_movements`
ADD COLUMN IF NOT EXISTS `warehouse_id` INT NULL AFTER `product_id`,
ADD COLUMN IF NOT EXISTS `store_id` INT NULL AFTER `warehouse_id`,
ADD COLUMN IF NOT EXISTS `reason` VARCHAR(100) NULL AFTER `reference_id`,
ADD COLUMN IF NOT EXISTS `quantity_before` INT NULL AFTER `reason`,
ADD COLUMN IF NOT EXISTS `quantity_after` INT NULL AFTER `quantity_before`,
ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Ajouter les index
ALTER TABLE `stock_movements`
ADD INDEX IF NOT EXISTS `idx_type` (`type`),
ADD INDEX IF NOT EXISTS `idx_created_at` (`created_at`);

-- ================================================================
-- 10. VUES UTILES POUR REQUÊTES COURANTES
-- ================================================================

-- Vue : Produits par fournisseur avec prix
DROP VIEW IF EXISTS `v_supplier_products_with_pricing`;
CREATE VIEW `v_supplier_products_with_pricing` AS
SELECT 
    sp.id,
    sp.supplier_id,
    s.name as supplier_name,
    sp.product_id,
    p.name as product_name,
    p.barcode,
    sp.supplier_sku,
    sp.purchase_price,
    p.sale_price,
    (p.sale_price - sp.purchase_price) as gross_margin,
    ((p.sale_price - sp.purchase_price) / p.sale_price * 100) as margin_percent,
    sp.minimum_order_qty,
    sp.pack_qty,
    sp.lead_time_days,
    sp.is_preferred,
    sp.is_active
FROM supplier_products sp
JOIN suppliers s ON sp.supplier_id = s.id
JOIN products p ON sp.product_id = p.id
WHERE sp.is_active = TRUE AND s.status = 'active';

-- Vue : Performance fournisseurs
DROP VIEW IF EXISTS `v_supplier_performance_dashboard`;
CREATE VIEW `v_supplier_performance_dashboard` AS
SELECT 
    s.id,
    s.name,
    s.status,
    s.rating,
    s.total_purchases,
    s.last_purchase_date,
    COALESCE(sp.total_orders, 0) as total_orders,
    COALESCE(sp.on_time_delivery_percent, 0) as on_time_delivery_percent,
    COALESCE(sp.order_accuracy_percent, 0) as order_accuracy_percent,
    COALESCE(sp.quality_rating, 0) as quality_rating,
    COALESCE(sp.average_order_value, 0) as average_order_value,
    COALESCE(sp.disputes_count, 0) as disputes_count,
    COUNT(DISTINCT sp2.id) as active_products
FROM suppliers s
LEFT JOIN supplier_performance sp ON s.id = sp.supplier_id
LEFT JOIN supplier_products sp2 ON s.id = sp2.supplier_id AND sp2.is_active = TRUE
GROUP BY s.id;

-- ================================================================
-- LOGS DE MIGRATION
-- ================================================================
-- ✅ Exécutée le: 2026-05-25
-- ✅ Tables créées: supplier_contacts, supplier_products, supplier_price_history, supplier_performance, warehouses, stores
-- ✅ Tables modifiées: suppliers, supplier_orders, stock_movements
-- ✅ Vues créées: v_supplier_products_with_pricing, v_supplier_performance_dashboard
-- ================================================================

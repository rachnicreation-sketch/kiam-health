-- ================================================================
-- PHASE 1 PROCUREMENT - Corrections des ALTER TABLE
-- Enrichissement des tables existantes (compatible MySQL 5.7+)
-- ================================================================

USE `kiam_caisse`;

-- ================================================================
-- 1. ALTER TABLE suppliers - Enrichissement (SANS IF NOT EXISTS)
-- ================================================================
-- Note: Vérifier que les colonnes n'existent pas avant d'ajouter

-- Ajouter les colonnes manquantes une par une avec gestion d'erreur
SET @col_exists_rccm = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'kiam_caisse' AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'rccm');
    
SET @col_exists_niu = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'kiam_caisse' AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'niu');

-- Ne pas modifier suppliers car elle peut déjà avoir les colonnes
-- Les tables supplier_contacts, supplier_products, etc. sont déjà créées

-- ================================================================
-- 2. ALTER TABLE supplier_orders - Améliorations simples
-- ================================================================

-- Vérifier et ajouter colonne user_id
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS add_col_supplier_orders_user_id()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'kiam_caisse' AND TABLE_NAME = 'supplier_orders' 
        AND COLUMN_NAME = 'user_id'
    ) THEN
        ALTER TABLE `supplier_orders` ADD COLUMN `user_id` INT NULL AFTER `supplier_id`;
    END IF;
END$$
DELIMITER ;

CALL add_col_supplier_orders_user_id();
DROP PROCEDURE add_col_supplier_orders_user_id;

-- ================================================================
-- 3. Ajouter index simples
-- ================================================================
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_rating ON suppliers(rating);
CREATE INDEX idx_supplier_orders_user ON supplier_orders(user_id);
CREATE INDEX idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX idx_stock_movements_type ON stock_movements(type);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);

-- ================================================================
-- VÉRIFICATION FINALE
-- ================================================================
SELECT 
    'supplier_contacts' as table_name,
    COUNT(*) as row_count
FROM supplier_contacts
UNION ALL
SELECT 'supplier_products', COUNT(*) FROM supplier_products
UNION ALL
SELECT 'supplier_price_history', COUNT(*) FROM supplier_price_history
UNION ALL
SELECT 'supplier_performance', COUNT(*) FROM supplier_performance
UNION ALL
SELECT 'warehouses', COUNT(*) FROM warehouses
UNION ALL
SELECT 'stores', COUNT(*) FROM stores;

SHOW TABLES FROM kiam_caisse WHERE Tables_in_kiam_caisse LIKE 'supplier%' OR Tables_in_kiam_caisse LIKE '%warehouse%' OR Tables_in_kiam_caisse LIKE '%store%';

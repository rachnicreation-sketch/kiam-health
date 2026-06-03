-- ================================================
-- NETTOYAGE COMPLET DE TOUTES LES DONNÉES FICTIVES
-- ================================================

-- Supprimer d'abord les données des tables dépendantes
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM stock_movements;
DELETE FROM supplier_order_items;
DELETE FROM supplier_orders;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM clients;
DELETE FROM suppliers;
DELETE FROM expenses;
DELETE FROM user_logs;
DELETE FROM advances;
DELETE FROM attendance;
DELETE FROM employees;
DELETE FROM cash_sessions;
DELETE FROM payroll_settings;

-- Réinitialiser les AUTO_INCREMENT
ALTER TABLE sale_items AUTO_INCREMENT = 1;
ALTER TABLE sales AUTO_INCREMENT = 1;
ALTER TABLE stock_movements AUTO_INCREMENT = 1;
ALTER TABLE supplier_order_items AUTO_INCREMENT = 1;
ALTER TABLE supplier_orders AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE clients AUTO_INCREMENT = 1;
ALTER TABLE suppliers AUTO_INCREMENT = 1;
ALTER TABLE expenses AUTO_INCREMENT = 1;
ALTER TABLE user_logs AUTO_INCREMENT = 1;
ALTER TABLE advances AUTO_INCREMENT = 1;
ALTER TABLE employees AUTO_INCREMENT = 1;
ALTER TABLE cash_sessions AUTO_INCREMENT = 1;
ALTER TABLE payroll_settings AUTO_INCREMENT = 1;

-- Mettre à jour les paramètres de l'entreprise avec valeurs par défaut
UPDATE settings SET 
    company_name = 'Votre Boutique',
    company_phone = '',
    company_email = '',
    company_address = '',
    currency = 'FCFA',
    tax_rate = 18.00,
    printer_config = '80mm_thermal'
WHERE id = 1;

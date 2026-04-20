-- Seed Data for Kiam SaaS Sectors
-- This script adds 2 fictional clients for each of the 6 sectors.
-- Passwords for all accounts are: kiam2026

USE kiam_saas;

-- Clear existing if needed (optional, depend on usage)
-- DELETE FROM kiam_global_users;
-- DELETE FROM kiam_tenants;

-- 1. SECTOR: HEALTH
INSERT INTO kiam_tenants (id, name, sector, subscription_plan, subscription_status) VALUES 
('t_health_1', 'Clinique Espoir', 'health', 'premium', 'active'),
('t_health_2', 'Hôpital de la Paix', 'health', 'basic', 'active');

-- 2. SECTOR: HOTEL
INSERT INTO kiam_tenants (id, name, sector, subscription_plan, subscription_status) VALUES 
('t_hotel_1', 'Grand Palace Hotel', 'hotel', 'premium', 'active'),
('t_hotel_2', 'Blue Horizon Resort', 'hotel', 'trial', 'trial');

-- 3. SECTOR: SCHOOL
INSERT INTO kiam_tenants (id, name, sector, subscription_plan, subscription_status) VALUES 
('t_school_1', 'Lycée Excellence', 'school', 'premium', 'active'),
('t_school_2', 'École Arc-en-ciel', 'school', 'basic', 'active');

-- 4. SECTOR: ERP
INSERT INTO kiam_tenants (id, name, sector, subscription_plan, subscription_status) VALUES 
('t_erp_1', 'Industrie Congo Plus', 'erp', 'enterprise', 'active'),
('t_erp_2', 'Distribution Nationale', 'erp', 'basic', 'active');

-- 5. SECTOR: SHOP
INSERT INTO kiam_tenants (id, name, sector, subscription_plan, subscription_status) VALUES 
('t_shop_1', 'Boutique Mode Chic', 'shop', 'basic', 'active'),
('t_shop_2', 'Supermarché du Coin', 'shop', 'trial', 'trial');

-- 6. SECTOR: ENTERPRISE
INSERT INTO kiam_tenants (id, name, sector, subscription_plan, subscription_status) VALUES 
('t_ent_1', 'Kiam Consulting', 'enterprise', 'premium', 'active'),
('t_ent_2', 'Tech Solutions SA', 'enterprise', 'enterprise', 'active');

-- GLOBALS USERS (Admin for each tenant)
-- Note: password_hash is simulated here as a simple string for this exercise.
-- In production, these should be real hashes (bcrypt/argon2).

-- Health Admins
INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES 
('u_health_1', 't_health_1', 'admin@espoir.health', 'kiam2026', 'tenant_admin'),
('u_health_2', 't_health_2', 'admin@paix.health', 'kiam2026', 'tenant_admin');

-- Hotel Admins
INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES 
('u_hotel_1', 't_hotel_1', 'admin@grandpalace.hotel', 'kiam2026', 'tenant_admin'),
('u_hotel_2', 't_hotel_2', 'admin@bluehorizon.hotel', 'kiam2026', 'tenant_admin');

-- School Admins
INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES 
('u_school_1', 't_school_1', 'admin@excellence.school', 'kiam2026', 'tenant_admin'),
('u_school_2', 't_school_2', 'admin@arcenciel.school', 'kiam2026', 'tenant_admin');

-- ERP Admins
INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES 
('u_erp_1', 't_erp_1', 'admin@congoplus.erp', 'kiam2026', 'tenant_admin'),
('u_erp_2', 't_erp_2', 'admin@distrinat.erp', 'kiam2026', 'tenant_admin');

-- Shop Admins
INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES 
('u_shop_1', 't_shop_1', 'admin@modechic.shop', 'kiam2026', 'tenant_admin'),
('u_shop_2', 't_shop_2', 'admin@supercoin.shop', 'kiam2026', 'tenant_admin');

-- Enterprise Admins
INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES 
('u_ent_1', 't_ent_1', 'admin@kiam.consulting', 'kiam2026', 'tenant_admin'),
('u_ent_2', 't_ent_2', 'admin@techsolutions.com', 'kiam2026', 'tenant_admin');

-- Consolidated Seed for KIAM SaaS + Multi-Sector Tenants
USE kiam_saas;

-- 1. Default SaaS Plans
INSERT INTO kiam_plans (id, name, price_monthly, max_users, max_storage_gb, features) VALUES 
('plan_basic', 'Basic', 25000.00, 5, 2, '{"modules": ["health_core"], "support": "email"}'),
('plan_pro', 'Professional', 75000.00, 20, 10, '{"modules": ["health_full", "hotel_core", "school_core"], "support": "chat"}'),
('plan_ent', 'Enterprise', 250000.00, 100, 100, '{"modules": ["all"], "support": "premium"}')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Multi-Sector Tenants (diversified)
INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status, mrr_value) VALUES
-- HEALTH (4 tenants)
('t_health_1', 'Clinique Espoir', 'health', 'plan_pro', 'active', 75000),
('t_health_2', 'Hôpital de la Paix', 'health', 'plan_ent', 'active', 250000),
('t_health_3', 'Centre Médical Saint-Joseph', 'health', 'plan_basic', 'active', 25000),
('t_health_4', 'Polyclinique Moderne', 'health', 'plan_pro', 'active', 75000),
-- HOTEL (4 tenants)
('t_hotel_1', 'Hôtel du Fleuve', 'hotel', 'plan_pro', 'active', 75000),
('t_hotel_2', 'Resort Paradiso', 'hotel', 'plan_ent', 'active', 250000),
('t_hotel_3', 'Grand Hôtel Brazzaville', 'hotel', 'plan_pro', 'active', 75000),
('t_hotel_4', 'Auberge de la Forêt', 'hotel', 'plan_basic', 'active', 25000),
-- SCHOOL (4 tenants)
('t_school_1', 'Lycée Excellence', 'school', 'plan_basic', 'active', 25000),
('t_school_2', 'Université Kiam', 'school', 'plan_pro', 'active', 75000),
('t_school_3', 'École Primaire Lumière', 'school', 'plan_basic', 'active', 25000),
('t_school_4', 'Collège Technique', 'school', 'plan_pro', 'active', 75000),
-- ERP / BUSINESS (4 tenants)
('t_erp_1', 'Matiaba Trade Center', 'erp', 'plan_pro', 'active', 75000),
('t_erp_2', 'Global Distribution', 'erp', 'plan_ent', 'active', 250000),
('t_erp_3', 'Agro Business Congo', 'erp', 'plan_pro', 'active', 75000),
('t_erp_4', 'Construction Plus', 'erp', 'plan_basic', 'active', 25000),
-- PHARMACY (4 tenants)
('t_pharma_1', 'Pharmacie Centrale', 'shop', 'plan_basic', 'active', 25000),
('t_pharma_2', 'Officine du Bien-être', 'shop', 'plan_pro', 'active', 75000),
('t_pharma_3', 'Pharmacie Express', 'shop', 'plan_basic', 'active', 25000),
('t_pharma_4', 'Médicaments Plus', 'shop', 'plan_pro', 'active', 75000),
-- ENTERPRISE (4 tenants)
('t_corp_1', 'Tech Innovations', 'enterprise', 'plan_pro', 'active', 75000),
('t_corp_2', 'Consulting Group', 'enterprise', 'plan_ent', 'active', 250000),
('t_corp_3', 'Digital Solutions', 'enterprise', 'plan_pro', 'active', 75000),
('t_corp_4', 'Business Partners', 'enterprise', 'plan_basic', 'active', 25000)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. Global Users (Master Admin + Tenant Owners)
-- Note: Passwords are 'kiam2026'
INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES
('u_saas_admin', 't_health_1', 'master@kiam.tech', 'kiam2026', 'saas_admin'),
('u_health_admin', 't_health_1', 'admin@espoir.com', 'kiam2026', 'tenant_admin'),
('u_health_admin2', 't_health_2', 'admin@paix.com', 'kiam2026', 'tenant_admin'),
('u_health_admin3', 't_health_3', 'admin@saintjoseph.com', 'kiam2026', 'tenant_admin'),
('u_health_admin4', 't_health_4', 'admin@moderne.com', 'kiam2026', 'tenant_admin'),
('u_hotel_admin', 't_hotel_1', 'manager@fleuve.com', 'kiam2026', 'tenant_admin'),
('u_hotel_admin2', 't_hotel_2', 'manager@paradiso.com', 'kiam2026', 'tenant_admin'),
('u_hotel_admin3', 't_hotel_3', 'manager@grandhotel.com', 'kiam2026', 'tenant_admin'),
('u_hotel_admin4', 't_hotel_4', 'manager@auberge.com', 'kiam2026', 'tenant_admin'),
('u_school_admin', 't_school_1', 'directeur@excellence.com', 'kiam2026', 'tenant_admin'),
('u_school_admin2', 't_school_2', 'recteur@universite.com', 'kiam2026', 'tenant_admin'),
('u_school_admin3', 't_school_3', 'directeur@lumiere.com', 'kiam2026', 'tenant_admin'),
('u_school_admin4', 't_school_4', 'directeur@technique.com', 'kiam2026', 'tenant_admin'),
('u_erp_admin', 't_erp_1', 'contact@matiaba.com', 'kiam2026', 'tenant_admin'),
('u_erp_admin2', 't_erp_2', 'contact@global.com', 'kiam2026', 'tenant_admin'),
('u_erp_admin3', 't_erp_3', 'contact@agrobusiness.com', 'kiam2026', 'tenant_admin'),
('u_erp_admin4', 't_erp_4', 'contact@construction.com', 'kiam2026', 'tenant_admin'),
('u_pharma_admin', 't_pharma_1', 'pharmacien@centrale.com', 'kiam2026', 'tenant_admin'),
('u_pharma_admin2', 't_pharma_2', 'pharmacien@bienetre.com', 'kiam2026', 'tenant_admin'),
('u_pharma_admin3', 't_pharma_3', 'pharmacien@express.com', 'kiam2026', 'tenant_admin'),
('u_pharma_admin4', 't_pharma_4', 'pharmacien@medicaments.com', 'kiam2026', 'tenant_admin'),
('u_corp_admin', 't_corp_1', 'ceo@tech.com', 'kiam2026', 'tenant_admin'),
('u_corp_admin2', 't_corp_2', 'ceo@consulting.com', 'kiam2026', 'tenant_admin'),
('u_corp_admin3', 't_corp_3', 'ceo@digitalsolutions.com', 'kiam2026', 'tenant_admin'),
('u_corp_admin4', 't_corp_4', 'ceo@partners.com', 'kiam2026', 'tenant_admin')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- 4. Initial Modules activation
INSERT IGNORE INTO kiam_tenant_modules (tenant_id, module_name, is_active) VALUES
-- Health tenants
('t_health_1', 'health', 1), ('t_health_1', 'pharmacy', 1),
('t_health_2', 'health', 1), ('t_health_2', 'pharmacy', 1), ('t_health_2', 'laboratory', 1),
('t_health_3', 'health', 1),
('t_health_4', 'health', 1), ('t_health_4', 'pharmacy', 1),
-- Hotel tenants
('t_hotel_1', 'hotel', 1), ('t_hotel_1', 'billing', 1),
('t_hotel_2', 'hotel', 1), ('t_hotel_2', 'billing', 1), ('t_hotel_2', 'restaurant', 1),
('t_hotel_3', 'hotel', 1), ('t_hotel_3', 'billing', 1),
('t_hotel_4', 'hotel', 1),
-- School tenants
('t_school_1', 'school', 1),
('t_school_2', 'school', 1), ('t_school_2', 'billing', 1),
('t_school_3', 'school', 1),
('t_school_4', 'school', 1), ('t_school_4', 'library', 1),
-- ERP tenants
('t_erp_1', 'erp', 1),
('t_erp_2', 'erp', 1), ('t_erp_2', 'inventory', 1), ('t_erp_2', 'accounting', 1),
('t_erp_3', 'erp', 1), ('t_erp_3', 'inventory', 1),
('t_erp_4', 'erp', 1),
-- Pharmacy tenants
('t_pharma_1', 'pharmacy', 1),
('t_pharma_2', 'pharmacy', 1), ('t_pharma_2', 'billing', 1),
('t_pharma_3', 'pharmacy', 1),
('t_pharma_4', 'pharmacy', 1), ('t_pharma_4', 'inventory', 1),
-- Enterprise tenants
('t_corp_1', 'enterprise', 1),
('t_corp_2', 'enterprise', 1), ('t_corp_2', 'hr', 1), ('t_corp_2', 'accounting', 1),
('t_corp_3', 'enterprise', 1), ('t_corp_3', 'hr', 1),
('t_corp_4', 'enterprise', 1)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- 5. Support Tickets
INSERT INTO kiam_support_tickets (id, tenant_id, user_id, subject, description, status, priority) VALUES 
('TK-1001', 't_health_1', 'u_health_admin', 'Bug rapport Mensuel', 'Les totaux ne correspondent pas.', 'open', 'high'),
('TK-1002', 't_hotel_1', 'u_hotel_admin', 'Demande de formation', 'Besoin de formation sur le module Check-in.', 'pending', 'medium')
ON DUPLICATE KEY UPDATE subject = VALUES(subject);

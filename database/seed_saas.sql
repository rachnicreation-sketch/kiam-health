-- Seed Data for Kiam SaaS Administration
USE kiam_saas;

-- 1. Default Plans
INSERT INTO kiam_plans (id, name, price_monthly, max_users, max_storage_gb, features) VALUES 
('plan_basic', 'Basic', 25000.00, 5, 2, '{"modules": ["health_core", "inventory_basic"], "support": "email"}'),
('plan_pro', 'Professional', 75000.00, 20, 10, '{"modules": ["health_full", "hotel_core", "school_core", "hr", "accounting"], "support": "chat"}'),
('plan_ent', 'Enterprise', 250000.00, 100, 100, '{"modules": ["all"], "support": "priority_24_7", "api_access": true}');

-- 2. Link existing tenants to plans (optional for existing ones)
-- UPDATE kiam_tenants SET plan_id = 'plan_pro' WHERE id LIKE 't_%';

-- 3. Pre-activate some modules for fictional tenants
INSERT INTO kiam_tenant_modules (tenant_id, module_name, is_active) VALUES 
('t_health_1', 'health', 1),
('t_health_1', 'pharmacy', 1),
('t_health_1', 'billing', 1),
('t_hotel_1', 'hotel', 1),
('t_hotel_1', 'billing', 1),
('t_school_1', 'school', 1),
('t_school_1', 'billing', 1);

-- 4. Sample Audit Logs
INSERT INTO kiam_audit_logs (user_id, tenant_id, action, entity_type, details) VALUES 
('u_saas_admin', NULL, 'LOGIN', 'super_admin', '{"ip": "127.0.0.1", "browser": "Chrome"}'),
('u_saas_admin', 't_health_1', 'MODULE_ACTIVATE', 'tenant_module', '{"module": "laboratory"}');

-- 5. Sample Support Tickets
INSERT INTO kiam_support_tickets (id, tenant_id, user_id, subject, description, status, priority) VALUES 
('TK-1001', 't_health_1', 'u_health_1', 'Bug rapport mensuel', 'Le rapport du mois de Mars ne s''affiche pas correctement.', 'open', 'high'),
('TK-1002', 't_hotel_1', 'u_hotel_1', 'Demande de formation', 'Nous souhaiterions une session zoom pour le module de facturation.', 'pending', 'medium');

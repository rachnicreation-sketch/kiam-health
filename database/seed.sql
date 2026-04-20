-- Seed Data for Kiam Health SaaS
-- Run AFTER schema.sql

USE kiam_saas;

-- =============================================
-- 1. CLINICS
-- =============================================
INSERT IGNORE INTO clinics (id, name, status, address, phone, email, website, tax_id) VALUES 
('t_health_1', 'Clinique Espoir', 'active', 'Avenue de l\'Indépendance, Brazzaville', '+242 06 123 4567', 'contact@espoir.com', 'www.espoir.cg', 'RCCM CG-BZV-01-2024-B12-001'),
('t_health_2', 'Hôpital de la Paix', 'active', 'Quartier Mpila, Brazzaville', '+242 05 987 6543', 'info@paix.com', 'www.paix.cg', 'RCCM CG-BZV-01-2023-B11-005');

-- =============================================
-- 2. USERS (password = 'password' in plain text for dev)
-- =============================================
INSERT IGNORE INTO users (id, email, password_hash, role, clinic_id, name) VALUES 
('u1', 'admin@saas.com', 'password', 'saas_admin', NULL, 'Super Admin'),
('u2', 'admin@espoir.com', 'password', 'clinic_admin', 't_health_1', 'Admin Espoir'),
('u3', 'admin@paix.com', 'password', 'clinic_admin', 't_health_2', 'Admin Paix'),
('u4', 'dr.mouelle@espoir.com', 'password', 'doctor', 't_health_1', 'Dr. Serge MOUELÉ'),
('u5', 'koumba@espoir.com', 'password', 'nurse', 't_health_1', 'Clarisse KOUMBA'),
('u6', 'dr.tchibinda@paix.com', 'password', 'doctor', 't_health_2', 'Dr. Alain TCHIBINDA'),
('u7', 'lab@espoir.com', 'password', 'lab_tech', 't_health_1', 'Technicien Labo Espoir'),
('u8', 'pharmacie@paix.com', 'password', 'pharmacist', 't_health_2', 'Pharmacien Paix');

-- =============================================
-- 3. BRANCHES
-- =============================================
INSERT IGNORE INTO branches (id, clinic_id, name, type, address, phone, manager, status) VALUES 
('b1', 't_health_1', 'Siège Principal', 'headquarters', 'Avenue de l\'Indépendance', '+242 06 123 4567', 'Dr Mouelé', 'open'),
('b2', 't_health_1', 'Antenne de Mpila', 'branch', 'Plateau des 15 ans, Brazzaville', '+242 06 888 9900', 'Mme Koumba', 'open'),
('b3', 't_health_2', 'Centre Médical Marion', 'headquarters', 'Quartier Mpila', '+242 05 987 6543', 'Dr Tchibinda', 'open');

-- =============================================
-- 4. PATIENTS
-- =============================================
INSERT IGNORE INTO patients (id, clinic_id, name, first_name, age, dob, gender, phone, address, city, blood_group, status) VALUES 
('PT-2026-0001', 't_health_1', 'NGOMA', 'Marie', 34, '1992-05-12', 'F', '+242 05 123 45 67', 'Place de la République', 'Pointe-Noire', 'O+', 'Actif'),
('PT-2026-0002', 't_health_2', 'OKO', 'Jean-Pierre', 52, '1974-03-25', 'M', '+242 06 678 12 34', 'Avenue de la Paix', 'Brazzaville', 'A-', 'Actif'),
('PT-2026-0003', 't_health_1', 'MABIALA', 'Thérèse', 28, '1998-11-02', 'F', '+242 04 444 55 66', 'Rond-point Kassaï', 'Brazzaville', 'B+', 'Soin Intensif'),
('PT-2026-0004', 't_health_2', 'LEON', 'Christian', 41, '1985-07-15', 'M', '+242 05 555 11 22', 'Quartier OCH', 'Pointe-Noire', 'O-', 'Actif'),
('PT-2026-0005', 't_health_1', 'BIYELA', 'Augustin', 67, '1959-08-20', 'M', '+242 06 111 22 33', 'Poto-Poto', 'Brazzaville', 'AB+', 'Actif'),
('PT-2026-0006', 't_health_1', 'NKOUNKOU', 'Christelle', 22, '2004-01-15', 'F', '+242 05 999 88 77', 'Moungali', 'Brazzaville', 'A+', 'Actif');

-- =============================================
-- 5. EMPLOYEES
-- =============================================
INSERT IGNORE INTO employees (id, clinic_id, name, first_name, department, position, base_salary, hire_date, status) VALUES 
('E1', 't_health_1', 'MOUELÉ', 'Serge', 'Médecine Générale', 'Médecin Chef', 850000, '2022-01-15', 'active'),
('E2', 't_health_1', 'KOUMBA', 'Clarisse', 'Infirmerie', 'Infirmière Major', 450000, '2022-03-10', 'active'),
('E3', 't_health_1', 'BANZOUZI', 'René', 'Pharmacie', 'Pharmacien', 550000, '2023-01-05', 'active'),
('E4', 't_health_2', 'TCHIBINDA', 'Alain', 'Chirurgie', 'Chirurgien', 1200000, '2023-06-01', 'active'),
('E5', 't_health_2', 'SOUNGA', 'Divine', 'Accueil', 'Réceptionniste', 250000, '2024-02-15', 'active');

-- =============================================
-- 6. MEDICAL ACTS CATALOG
-- =============================================
INSERT IGNORE INTO medical_acts (id, clinic_id, name, category, price) VALUES 
('ACT-001', 't_health_1', 'Consultation Générale', 'Consultation', 15000),
('ACT-002', 't_health_1', 'Consultation Spécialisée', 'Consultation', 25000),
('ACT-003', 't_health_1', 'Pansement Simple', 'Soins', 5000),
('ACT-004', 't_health_1', 'Injection IM/IV', 'Soins', 2000),
('ACT-005', 't_health_1', 'Accouchement Simple', 'Maternité', 75000),
('ACT-006', 't_health_2', 'Consultation Générale', 'Consultation', 15000),
('ACT-007', 't_health_2', 'Consultation Spécialisée Chirurgie', 'Consultation', 35000),
('ACT-008', 't_health_2', 'Radiographie', 'Imagerie', 20000);

-- =============================================
-- 7. LAB SERVICES CATALOG
-- =============================================
INSERT IGNORE INTO lab_services (id, clinic_id, testName, category, price, unit, normativeValue) VALUES 
('LAB-001', 't_health_1', 'Hémogramme (NFS)', 'Hématologie', 8500, 'g/dL', '12-16'),
('LAB-002', 't_health_1', 'Glycémie à jeun', 'Biochimie', 3500, 'g/L', '0.7-1.1'),
('LAB-003', 't_health_1', 'Test de Grossesse (HCG)', 'Sérologie', 5000, 'mUI/mL', '< 5'),
('LAB-004', 't_health_1', 'Goutte Épaisse (GE)', 'Parasitologie', 3000, 'parasites/µL', 'Négatif'),
('LAB-005', 't_health_2', 'Bilan Rénal', 'Biochimie', 12000, 'mg/L', '5-20'),
('LAB-006', 't_health_2', 'Transaminases (ASAT/ALAT)', 'Biochimie', 7500, 'UI/L', '< 40'),
('LAB-007', 't_health_2', 'Sérologie VIH', 'Sérologie', 6000, '-', 'Négatif');

-- =============================================
-- 8. BEDS
-- =============================================
INSERT IGNORE INTO beds (id, clinic_id, ward, room, bed_num, status) VALUES 
('B1-01', 't_health_1', 'Pédiatrie', '101', '1', 'available'),
('B1-02', 't_health_1', 'Pédiatrie', '101', '2', 'available'),
('B1-03', 't_health_1', 'Chirurgie', '201', '1', 'available'),
('B1-04', 't_health_1', 'Maternité', '301', '1', 'available'),
('B2-01', 't_health_2', 'Médecine Interne', '101', '1', 'available'),
('B2-02', 't_health_2', 'Chirurgie', '201', '1', 'available'),
('B2-03', 't_health_2', 'Urgences', '001', '1', 'available');

-- =============================================
-- 9. MEDICATIONS (Pharmacy stock)
-- =============================================
INSERT IGNORE INTO medications (id, clinic_id, name, category, stock, unit, threshold, price) VALUES 
('MED-001', 't_health_1', 'Paracétamol 500mg', 'Antalgique', 250, 'comprimés', 50, 500),
('MED-002', 't_health_1', 'Amoxicilline 250mg', 'Antibiotique', 120, 'gélules', 30, 1500),
('MED-003', 't_health_1', 'Ibuprofène 400mg', 'Anti-inflammatoire', 80, 'comprimés', 20, 800),
('MED-004', 't_health_1', 'Métronidazole 250mg', 'Antibiotique', 60, 'comprimés', 20, 1200),
('MED-005', 't_health_1', 'Artéméther-Luméfantrine (AL)', 'Antipaludéen', 8, 'boites', 10, 4500),
('MED-006', 'c2', 'Paracétamol 1000mg', 'Antalgique', 180, 'comprimés', 40, 700),
('MED-007', 'c2', 'Tramadol 50mg', 'Antalgique', 45, 'ampoules', 15, 3500),
('MED-008', 'c2', 'Oméprazole 20mg', 'Gastroprotecteur', 5, 'boites', 10, 2500);

-- =============================================
-- 10. SAMPLE CONSULTATIONS
-- =============================================
INSERT IGNORE INTO consultations (id, clinic_id, patient_id, doctor_id, consultation_date, reason, diagnosis, prescription, status) VALUES
('CONS-001', 'c1', 'PT-2026-0001', 'u4', '2026-04-10 09:30:00', 'Fièvre et frissons depuis 2 jours', 'Paludisme simple (Plasmodium falciparum)', 'Artéméther-Luméfantrine (AL) - 2 cp matin et soir x 3 jours. Paracétamol 500mg en cas de fièvre.', 'completed'),
('CONS-002', 'c1', 'PT-2026-0003', 'u4', '2026-04-13 11:00:00', 'Douleurs abdominales, nausées', 'Gastro-entérite aiguë', 'Métronidazole 250mg - 3x/jour x 5 jours. Sérum de réhydratation orale. Repos.', 'completed'),
('CONS-003', 'c2', 'PT-2026-0002', 'u6', '2026-04-12 14:30:00', 'Contrôle tension artérielle', 'Hypertension artérielle stade 2', 'Amlodipine 5mg - 1cp/jour. Régime hyposodé. Contrôle dans 1 mois.', 'completed');

-- =============================================
-- 11. SAMPLE INVOICES
-- =============================================
INSERT IGNORE INTO invoices (id, clinic_id, patient_id, invoice_date, total_amount, status, payment_method) VALUES
('FAC-2026-0001', 'c1', 'PT-2026-0001', '2026-04-10', 22000, 'paid', 'cash'),
('FAC-2026-0002', 'c1', 'PT-2026-0003', '2026-04-13', 15000, 'pending', NULL),
('FAC-2026-0003', 'c2', 'PT-2026-0002', '2026-04-12', 25000, 'paid', 'transfer');

INSERT IGNORE INTO invoice_items (invoice_id, description, amount) VALUES
('FAC-2026-0001', 'Consultation Générale', 15000),
('FAC-2026-0001', 'Lab: Goutte Épaisse (GE)', 3000),
('FAC-2026-0001', 'Pharmacie: Artéméther-Luméfantrine x1', 4500),
('FAC-2026-0002', 'Consultation Générale', 15000),
('FAC-2026-0003', 'Consultation Spécialisée', 25000);

-- =============================================
-- 12. SAMPLE TRANSACTIONS (Accounting)
-- =============================================
INSERT IGNORE INTO transactions (id, clinic_id, type, amount, category, transaction_date, description, payment_method) VALUES
('TRX-001', 'c1', 'income', 22000, 'Consultations', '2026-04-10', 'Règlement facture FAC-2026-0001 - Patient NGOMA Marie', 'cash'),
('TRX-002', 'c1', 'expense', 150000, 'Fournitures Médicales', '2026-04-08', 'Achat stock médicaments - Paracétamol, Amoxicilline', 'transfer'),
('TRX-003', 'c2', 'income', 25000, 'Consultations', '2026-04-12', 'Règlement facture FAC-2026-0003 - Patient OKO Jean-Pierre', 'transfer'),
('TRX-004', 'c1', 'expense', 850000, 'Salaires', '2026-04-05', 'Salaire Avril 2026 - Dr MOUELÉ Serge', 'transfer'),
('TRX-005', 'c2', 'expense', 1200000, 'Salaires', '2026-04-05', 'Salaire Avril 2026 - Dr TCHIBINDA Alain', 'transfer');

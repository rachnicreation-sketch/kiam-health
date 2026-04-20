<?php
require_once 'api/config.php';

echo "Démarrage du peuplement de la base de données...\n";

try {
    $pdo->beginTransaction();

    // 1. Nettoyage des tables existantes (SaaS Core)
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $tablesToTruncate = [
        'kiam_plans', 'kiam_tenants', 'kiam_global_users', 'kiam_tenant_modules',
        'clinics', 'users', 'patients', 'consultations',
        'hotel_rooms', 'hotel_bookings',
        'school_students', 'school_grades',
        'inventory_items'
    ];
    foreach ($tablesToTruncate as $table) {
        $pdo->exec("TRUNCATE TABLE $table");
        echo "Table $table vidée.\n";
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 2. Création des Plans
    $plans = [
        ['plan_basic', 'Kiam Basic', 25000, 5, json_encode(['Dashboard', 'Patients', 'Planning'])],
        ['plan_pro', 'Kiam Pro', 75000, 20, json_encode(['Tout les modules', 'Support 24/7', 'Multi-sites'])],
        ['plan_enterprise', 'Kiam Enterprise', 250000, 999, json_encode(['Illimité', 'Customs', 'On-premise'])]
    ];
    $stmt = $pdo->prepare("INSERT INTO kiam_plans (id, name, price_monthly, max_users, features) VALUES (?, ?, ?, ?, ?)");
    foreach ($plans as $p) {
        $stmt->execute($p);
    }
    echo "Plans créés.\n";

    // 3. Création du SaaS Master Admin
    // Tenant fictif pour le SaaS Admin lui-même
    $pdo->exec("INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status) VALUES ('t_saas', 'Kiam Corp', 'enterprise', 'plan_enterprise', 'active')");
    $pdo->exec("INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES ('u_saas_admin', 't_saas', 'admin@kiam.com', 'kiam2026', 'saas_admin')");
    echo "Administrateur SaaS créé (admin@kiam.com).\n";

    // 4. Création du Tenant SANTÉ (Clinique)
    $pdo->exec("INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status, mrr_value) VALUES ('t_health', 'Clinique La Paix', 'health', 'plan_pro', 'active', 75000)");
    $pdo->exec("INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES ('u_health_admin', 't_health', 'health@kiam.com', 'kiam2026', 'tenant_admin')");
    
    // Données spécifiques Santé
    $pdo->exec("INSERT INTO clinics (id, name, status, address) VALUES ('t_health', 'Clinique La Paix', 'active', 'Quartier Plateau, Abidjan')");
    
    // Création d'un docteur dans la table local 'users'
    $pdo->exec("INSERT INTO users (id, clinic_id, email, password_hash, role, name, specialty) VALUES ('doc_001', 't_health', 'docteur@kiam.com', 'kiam2026', 'doctor', 'Dr. Keita', 'Généraliste')");
    
    $pdo->exec("INSERT INTO patients (id, clinic_id, name, first_name, gender, blood_group) VALUES ('pat_001', 't_health', 'Koffi', 'Jean', 'M', 'O+')");
    $pdo->exec("INSERT INTO consultations (id, clinic_id, patient_id, doctor_id, reason, diagnosis) VALUES ('cons_001', 't_health', 'pat_001', 'doc_001', 'Fièvre persistante', 'Paludisme simple')");
    echo "Tenant Santé créé (health@kiam.com / docteur@kiam.com).\n";


    // 5. Création du Tenant HOTEL
    $pdo->exec("INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status, mrr_value) VALUES ('t_hotel', 'Hôtel Horizon', 'hotel', 'plan_pro', 'trial', 0)");
    $pdo->exec("INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES ('u_hotel_admin', 't_hotel', 'hotel@kiam.com', 'kiam2026', 'tenant_admin')");
    // Données spécifiques Hotel
    $pdo->exec("INSERT INTO hotel_rooms (id, clinic_id, room_number, type, price, status) VALUES ('room_101', 't_hotel', '101', 'Suite Royale', 85000, 'available')");
    $pdo->exec("INSERT INTO hotel_rooms (id, clinic_id, room_number, type, price, status) VALUES ('room_102', 't_hotel', '102', 'Standard', 35000, 'occupied')");
    echo "Tenant Hôtel créé (hotel@kiam.com).\n";

    // 6. Création du Tenant ÉCOLE
    $pdo->exec("INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status, mrr_value) VALUES ('t_school', 'Lycée des Talents', 'school', 'plan_basic', 'active', 25000)");
    $pdo->exec("INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES ('u_school_admin', 't_school', 'school@kiam.com', 'kiam2026', 'tenant_admin')");
    // Données spécifiques Ecole
    $pdo->exec("INSERT INTO school_students (id, clinic_id, name, first_name, class_level) VALUES ('stud_001', 't_school', 'Amar', 'Yasmine', 'Terminale D')");
    echo "Tenant École créé (school@kiam.com).\n";

    // 7. Création du Tenant ERP (Industriel)
    $pdo->exec("INSERT INTO kiam_tenants (id, name, sector, plan_id, subscription_status, mrr_value) VALUES ('t_erp', 'Kiam Industrial Group', 'erp', 'plan_enterprise', 'active', 250000)");
    $pdo->exec("INSERT INTO kiam_global_users (id, tenant_id, email, password_hash, global_role) VALUES ('u_erp_admin', 't_erp', 'erp@kiam.com', 'kiam2026', 'tenant_admin')");
    // Données spécifiques ERP/Inventaire
    $pdo->exec("INSERT INTO inventory_items (id, clinic_id, name, category, stock, unit, price_sell) VALUES ('item_001', 't_erp', 'Unité Centrale HP', 'Matériel Info', 15, 'pcs', 150000)");
    echo "Tenant ERP créé (erp@kiam.com).\n";

    $pdo->commit();
    echo "Peuplement terminé avec succès !\n";

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    die("ERREUR lors du peuplement : " . $e->getMessage());
}
?>

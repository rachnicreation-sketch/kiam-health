<?php
/**
 * Script d'initialisation de la base de données pour le système d'abonnement KIAM.
 * Crée/Modifie les tables nécessaires et insère les forfaits et modules.
 */
require_once 'config.php';

function safeAddColumn($pdo, $table, $column, $definition) {
    try {
        $pdo->exec("ALTER TABLE $table ADD COLUMN $column $definition");
        echo "Colonne '$column' ajoutée à la table '$table'.\n";
    } catch (Exception $e) {
        // Ignorer si la colonne existe déjà
    }
}

try {
    echo "=== CORR-INITIALISATION DU SYSTÈME DE FACTURATION KIAM ===\n";

    // 1. Structure de kiam_plans (Forfaits)
    safeAddColumn($pdo, 'kiam_plans', 'price_monthly', 'DECIMAL(15,2) DEFAULT 0');
    safeAddColumn($pdo, 'kiam_plans', 'price_yearly', 'DECIMAL(15,2) DEFAULT 0');
    safeAddColumn($pdo, 'kiam_plans', 'max_storage_gb', 'INT DEFAULT 5');
    safeAddColumn($pdo, 'kiam_plans', 'description', 'TEXT');
    
    // 2. Structure de kiam_tenants (Locataires)
    safeAddColumn($pdo, 'kiam_tenants', 'trial_ends_at', 'TIMESTAMP NULL DEFAULT NULL');
    safeAddColumn($pdo, 'kiam_tenants', 'next_billing_date', 'DATE NULL');
    safeAddColumn($pdo, 'kiam_tenants', 'mrr_value', 'DECIMAL(15,2) DEFAULT 0');
    safeAddColumn($pdo, 'kiam_tenants', 'max_users_limit', 'INT DEFAULT NULL');

    // 3. Structure de kiam_subscriptions (Abonnements / Transactions)
    $pdo->exec("CREATE TABLE IF NOT EXISTS kiam_subscriptions (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50) NOT NULL,
        plan_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        start_date DATETIME NOT NULL,
        expiration_date DATETIME NOT NULL,
        is_trial TINYINT(1) DEFAULT 0,
        max_users INT DEFAULT 10,
        allowed_storage_gb INT DEFAULT 5,
        amount_paid DECIMAL(15,2) DEFAULT 0,
        payment_method VARCHAR(50) DEFAULT 'credit_card',
        billing_frequency ENUM('monthly', 'yearly') DEFAULT 'monthly',
        auto_renew TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 4. Structure de kiam_tenant_modules (Activation manuelle par tenant)
    $pdo->exec("CREATE TABLE IF NOT EXISTS kiam_tenant_modules (
        tenant_id VARCHAR(50) NOT NULL,
        module_name VARCHAR(100) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        PRIMARY KEY (tenant_id, module_name)
    )");

    // 5. Structure de kiam_addons (Modules complémentaires payables séparément)
    $pdo->exec("CREATE TABLE IF NOT EXISTS kiam_addons (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price_monthly DECIMAL(15,2) NOT NULL,
        module_name VARCHAR(100) NOT NULL
    )");

    // 6. Seeding des Add-ons
    $pdo->exec("DELETE FROM kiam_addons");
    $addons = [
        ['addon_commercial', 'Gestion Commerciale', 15000, 'commercial'],
        ['addon_wms', 'Stocks & WMS', 20000, 'inventory'],
        ['addon_ohada', 'Comptabilité OHADA', 25000, 'accounting'],
        ['addon_hr', 'RH', 20000, 'hr'],
        ['addon_payroll', 'Paie', 15000, 'payrolls'],
        ['addon_pos', 'Caisse/POS', 10000, 'caisse'],
        ['addon_procurement', 'Achats', 15000, 'procurement'],
        ['addon_crm', 'CRM', 15000, 'crm'],
        ['addon_projects', 'Gestion de projets', 20000, 'projects'],
        ['addon_ticketing', 'Ticketing', 15000, 'ticketing'],
        ['addon_signature', 'Signature électronique', 10000, 'signature'],
        ['addon_api', 'API', 25000, 'api']
    ];
    $stmt = $pdo->prepare("INSERT INTO kiam_addons (id, name, price_monthly, module_name) VALUES (?, ?, ?, ?)");
    foreach ($addons as $addon) {
        $stmt->execute($addon);
    }

    // 7. Seeding des Forfaits (Plans)
    $plans = [
        [
            'id' => 'plan_decouverte',
            'name' => 'Découverte',
            'price_monthly' => 0.00,
            'price_yearly' => 0.00,
            'max_users' => 10,
            'max_storage_gb' => 5,
            'features' => json_encode([
                'Gratuit pendant 35 jours',
                'Jusqu\'à 10 utilisateurs',
                'Accès à tous les modules KIAM',
                'Aucune limitation fonctionnelle'
            ], JSON_UNESCAPED_UNICODE),
            'is_popular' => 0,
            'modules_included' => 'health,pharmacy,hotel,school,erp,shop,enterprise,hr,caisse,billing,clients,dashboard,inventory,procurement,suppliers,accounting,payrolls,crm,projects,reports,api,ticketing,signature',
            'description' => 'Testez gratuitement toutes les fonctionnalités de Kiam.'
        ],
        [
            'id' => 'plan_starter',
            'name' => 'Starter',
            'price_monthly' => 25000.00,
            'price_yearly' => 255000.00,
            'max_users' => 3,
            'max_storage_gb' => 10,
            'features' => json_encode([
                '3 utilisateurs maximum',
                'Caisse / POS',
                'Facturation',
                'Gestion Clients',
                'Tableau de bord de base'
            ], JSON_UNESCAPED_UNICODE),
            'is_popular' => 0,
            'modules_included' => 'caisse,billing,clients,dashboard',
            'description' => 'L\'essentiel pour démarrer la gestion de votre activité commerciale.'
        ],
        [
            'id' => 'plan_essentiel',
            'name' => 'Essentiel',
            'price_monthly' => 50000.00,
            'price_yearly' => 510000.00,
            'max_users' => 10,
            'max_storage_gb' => 25,
            'features' => json_encode([
                'Jusqu\'à 10 utilisateurs',
                'Inclut Starter',
                'Gestion de Stocks',
                'Achats & Approvisionnements',
                'Gestion Fournisseurs'
            ], JSON_UNESCAPED_UNICODE),
            'is_popular' => 0,
            'modules_included' => 'caisse,billing,clients,dashboard,inventory,procurement,suppliers',
            'description' => 'Idéal pour les structures ayant besoin de gérer stocks et fournisseurs.'
        ],
        [
            'id' => 'plan_business',
            'name' => 'Business',
            'price_monthly' => 100000.00,
            'price_yearly' => 1020000.00,
            'max_users' => 30,
            'max_storage_gb' => 100,
            'features' => json_encode([
                'Jusqu\'à 30 utilisateurs',
                'Inclut Essentiel',
                'Comptabilité OHADA complète',
                'Gestion RH & Collaborateurs',
                'Gestion de la Paie'
            ], JSON_UNESCAPED_UNICODE),
            'is_popular' => 1,
            'modules_included' => 'caisse,billing,clients,dashboard,inventory,procurement,suppliers,accounting,hr,payrolls',
            'description' => 'La solution complète pour structurer et automatiser votre PME.'
        ],
        [
            'id' => 'plan_professional',
            'name' => 'Professional',
            'price_monthly' => 180000.00,
            'price_yearly' => 1836000.00,
            'max_users' => 80,
            'max_storage_gb' => 500,
            'features' => json_encode([
                'Jusqu\'à 80 utilisateurs',
                'Inclut Business',
                'CRM / Gestion Commerciale',
                'Gestion de projets collaborative',
                'Rapports & analyses avancés',
                'Accès API de base'
            ], JSON_UNESCAPED_UNICODE),
            'is_popular' => 0,
            'modules_included' => 'caisse,billing,clients,dashboard,inventory,procurement,suppliers,accounting,hr,payrolls,crm,projects,reports,api',
            'description' => 'Pour les entreprises en forte croissance nécessitant des outils collaboratifs.'
        ],
        [
            'id' => 'plan_enterprise',
            'name' => 'Enterprise',
            'price_monthly' => 0.00, // Sur devis
            'price_yearly' => 0.00,
            'max_users' => 9999, // Illimité
            'max_storage_gb' => 2000,
            'features' => json_encode([
                'Utilisateurs illimités',
                'Accès complet à tous les modules',
                'Hébergement cloud dédié',
                'Développements spécifiques',
                'Support prioritaire 24/7'
            ], JSON_UNESCAPED_UNICODE),
            'is_popular' => 0,
            'modules_included' => 'health,pharmacy,hotel,school,erp,shop,enterprise,hr,caisse,billing,clients,dashboard,inventory,procurement,suppliers,accounting,payrolls,crm,projects,reports,api,ticketing,signature',
            'description' => 'Sur-mesure et dédié. Le niveau ultime pour les grands groupes.'
        ]
    ];

    $planStmt = $pdo->prepare("
        INSERT INTO kiam_plans (id, name, price_monthly, price_yearly, max_users, max_storage_gb, features, is_popular, modules_included, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            name = VALUES(name),
            price_monthly = VALUES(price_monthly),
            price_yearly = VALUES(price_yearly),
            max_users = VALUES(max_users),
            max_storage_gb = VALUES(max_storage_gb),
            features = VALUES(features),
            is_popular = VALUES(is_popular),
            modules_included = VALUES(modules_included),
            description = VALUES(description)
    ");

    foreach ($plans as $p) {
        $planStmt->execute([
            $p['id'],
            $p['name'],
            $p['price_monthly'],
            $p['price_yearly'],
            $p['max_users'],
            $p['max_storage_gb'],
            $p['features'],
            $p['is_popular'],
            $p['modules_included'],
            $p['description']
        ]);
        echo "Forfait '{$p['name']}' configuré avec succès.\n";
    }

    echo "=== INITIALISATION TERMINÉE AVEC SUCCÈS ===\n";

} catch (Exception $e) {
    echo "ERREUR : " . $e->getMessage() . "\n";
}

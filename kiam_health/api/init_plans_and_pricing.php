<?php
/**
 * Script de configuration des Forfaits & Tarifs de Kiam SaaS
 * Met à jour kiam_plans avec des tarifs réels et une segmentation des modules.
 */
require_once 'config.php';

try {
    echo "=== CONFIGURATION DES FORFAITS ET TARIFS KIAM ===\n";

    // 1. Définition des plans (avec features encodées en JSON pour respecter la contrainte MySQL)
    $plans = [
        [
            'id' => 'plan_basic',
            'name' => 'Basique',
            'price' => 25000.00,
            'max_users' => 5,
            'modules_included' => 'health,school,shop',
            'features' => json_encode([
                'Idéal pour les petites structures',
                '5 utilisateurs maximum',
                'Accès aux modules de base (Santé, École, Commerce)',
                'Support par ticket sous 48h'
            ], JSON_UNESCAPED_UNICODE),
            'is_popular' => 0
        ],
        [
            'id' => 'plan_pro',
            'name' => 'Professionnel',
            'price' => 75000.00,
            'max_users' => 20,
            'modules_included' => 'health,pharmacy,school,erp,shop,hr',
            'features' => json_encode([
                'Idéal pour les cliniques et PME',
                'Jusqu\'à 20 utilisateurs',
                'Modules avancés (Pharmacie, ERP/Caisse, RH & Paie)',
                'Support prioritaire'
            ], JSON_UNESCAPED_UNICODE),
            'is_popular' => 1
        ],
        [
            'id' => 'plan_ent',
            'name' => 'Entreprise',
            'price' => 150000.00,
            'max_users' => 100,
            'modules_included' => 'health,pharmacy,hotel,school,erp,shop,enterprise,hr',
            'features' => json_encode([
                'Accès illimité à l\'écosystème Kiam',
                'Jusqu\'à 100 utilisateurs',
                'Tous les modules inclus (Projets, CRM, Hôtel)',
                'Support dédié 24/7 et SLAs'
            ], JSON_UNESCAPED_UNICODE),
            'is_popular' => 0
        ]
    ];

    // 2. Insertion / Mise à jour dans la base de données
    $stmt = $pdo->prepare("
        INSERT INTO kiam_plans (id, name, price, max_users, modules_included, features, is_popular)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            name = VALUES(name), 
            price = VALUES(price), 
            max_users = VALUES(max_users), 
            modules_included = VALUES(modules_included), 
            features = VALUES(features), 
            is_popular = VALUES(is_popular)
    ");

    foreach ($plans as $p) {
        $stmt->execute([
            $p['id'],
            $p['name'],
            $p['price'],
            $p['max_users'],
            $p['modules_included'],
            $p['features'],
            $p['is_popular']
        ]);
        echo "Forfait '{$p['name']}' ({$p['id']}) configuré à " . number_format($p['price'], 0, ',', ' ') . " CFA / mois.\n";
    }

    echo "=== CONFIGURATION TERMINÉE AVEC SUCCÈS ===\n";

} catch (Exception $e) {
    echo "ERREUR : " . $e->getMessage() . "\n";
}
?>

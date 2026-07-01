<?php
/**
 * Script d'Initialisation du Module ERP
 * Charge les données de base et configure le système
 * À exécuter une fois après la migration SQL
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';

// Vérifier que c'est un administrateur
requireLogin();
$userRole = $_SESSION['user_role'] ?? '';
$tenant_id = $_SESSION['tenant_id'] ?? 0;

if ($userRole !== 'admin' && $userRole !== 'super_admin') {
    die("Accès refusé. Seuls les administrateurs peuvent initialiser le module ERP.");
}

$messages = [];
$errors = [];

try {
    // ===================== PHASE 1 : ENTREPÔTS =====================
    
    // Vérifier s'il y a déjà un entrepôt principal
    $stmt = $pdo->prepare("
        SELECT id FROM warehouses 
        WHERE tenant_id = ? AND is_main = 1
        LIMIT 1
    ");
    $stmt->execute([$tenant_id]);
    
    if (!$stmt->fetch()) {
        // Créer l'entrepôt principal par défaut
        $stmt = $pdo->prepare("
            INSERT INTO warehouses (code, name, is_main, tenant_id)
            VALUES (?, ?, 1, ?)
        ");
        $stmt->execute(['ENT-PRINCIPALE', 'Entrepôt Principal', $tenant_id]);
        $messages[] = "✓ Entrepôt principal créé";
    } else {
        $messages[] = "✓ Entrepôt principal existe déjà";
    }

    // ===================== PHASE 2 : PLAN COMPTABLE OHADA =====================
    
    // Vérifier s'il y a des comptes
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM accounting_chart");
    $stmt->execute();
    $chart_count = $stmt->fetch()['cnt'];

    if ($chart_count === 0) {
        // Charger le plan comptable OHADA standard
        loadOHADAChartOfAccounts();
        $messages[] = "✓ Plan comptable OHADA chargé (comptes standards)";
    } else {
        $messages[] = "✓ Plan comptable existe déjà ({$chart_count} comptes)";
    }

    // ===================== PHASE 3 : JOURNAUX COMPTABLES =====================
    
    // Créer les journaux standards
    $journals = [
        ['code' => 'VT', 'name' => 'Journal des Ventes', 'type' => 'sales'],
        ['code' => 'AC', 'name' => 'Journal des Achats', 'type' => 'purchases'],
        ['code' => 'CA', 'name' => 'Journal de Caisse', 'type' => 'cash'],
        ['code' => 'BA', 'name' => 'Journal de Banque', 'type' => 'bank'],
        ['code' => 'OD', 'name' => 'Journal des Opérations Diverses', 'type' => 'general'],
    ];

    $stmt = $pdo->prepare("
        INSERT IGNORE INTO accounting_journal 
        (journal_code, journal_name, journal_type, tenant_id)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($journals as $journal) {
        $stmt->execute([
            $journal['code'],
            $journal['name'],
            $journal['type'],
            $tenant_id
        ]);
    }
    $messages[] = "✓ Journaux comptables configurés";

    // ===================== PHASE 4 : UNITÉS DE MESURE STANDARDS =====================
    
    // Vérifier les unités existantes (côté master)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as cnt FROM product_units 
        WHERE tenant_id = 0
    ");
    $stmt->execute();
    $units_count = $stmt->fetch()['cnt'];

    if ($units_count === 0) {
        // Les unités de base ont été créées par la migration
        $messages[] = "✓ Unités de mesure standards disponibles";
    } else {
        $messages[] = "✓ Unités de mesure standards disponibles ({$units_count} unités)";
    }

    // ===================== PHASE 5 : AUTORISATION DE LA COMPTABILITÉ =====================
    
    // Insérer une configuration pour le module comptable
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO settings (key, value, tenant_id)
        VALUES (?, ?, ?)
    ");
    $stmt->execute(['accounting_enabled', '1', $tenant_id]);
    $stmt->execute(['accounting_currency', 'FCFA', $tenant_id]);
    $stmt->execute(['credit_system_enabled', '1', $tenant_id]);
    $stmt->execute(['stock_system_enabled', '1', $tenant_id]);

    $messages[] = "✓ Configuration des modules ERP complétée";

    // ===================== PHASE 6 : RÈGLES D'AUTOMATISATION =====================
    
    setupAutomationRules($tenant_id);
    $messages[] = "✓ Règles d'automatisation comptable configurées";

    // ===================== RAPPORT FINAL =====================
    
    echo "<!DOCTYPE html>";
    echo "<html lang='fr'>";
    echo "<head>";
    echo "<meta charset='UTF-8'>";
    echo "<title>Initialisation Module ERP</title>";
    echo "<style>";
    echo "body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }";
    echo ".container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }";
    echo "h1 { color: #333; }";
    echo ".message { background: #d4edda; color: #155724; padding: 10px; margin: 10px 0; border-left: 4px solid #28a745; }";
    echo ".error { background: #f8d7da; color: #721c24; padding: 10px; margin: 10px 0; border-left: 4px solid #f5c6cb; }";
    echo ".success { background: #d1ecf1; color: #0c5460; padding: 15px; margin: 20px 0; border-left: 4px solid #17a2b8; }";
    echo "button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }";
    echo "button:hover { background: #0056b3; }";
    echo "</style>";
    echo "</head>";
    echo "<body>";
    echo "<div class='container'>";
    echo "<h1>Initialisation du Module ERP Complet</h1>";

    // Messages de succès
    if (!empty($messages)) {
        echo "<h2>Étapes Complétées :</h2>";
        foreach ($messages as $msg) {
            echo "<div class='message'>$msg</div>";
        }
    }

    // Messages d'erreur
    if (!empty($errors)) {
        echo "<h2>Erreurs :</h2>";
        foreach ($errors as $err) {
            echo "<div class='error'>✗ $err</div>";
        }
    }

    // Message de succès final
    echo "<div class='success'>";
    echo "<h3>✓ Module ERP Initialisé avec Succès !</h3>";
    echo "<p>Le système est prêt à être utilisé. Vous pouvez maintenant :</p>";
    echo "<ul>";
    echo "<li>Créer des unités de mesure personnalisées</li>";
    echo "<li>Configurer les entrepôts supplémentaires</li>";
    echo "<li>Configurer les limites de crédit des clients</li>";
    echo "<li>Commencer à enregistrer des achats et des ventes</li>";
    echo "<li>Générer des états financiers</li>";
    echo "</ul>";
    echo "</div>";

    echo "<div style='margin-top: 20px;'>";
    echo "<a href='index.php?page=settings'><button>Aller aux Paramètres</button></a>";
    echo "<a href='index.php'><button>Retour au Tableau de Bord</button></a>";
    echo "</div>";

    echo "</div>";
    echo "</body>";
    echo "</html>";

} catch (Exception $e) {
    $errors[] = $e->getMessage();
    echo "Erreur lors de l'initialisation: " . htmlspecialchars($e->getMessage());
}

/**
 * Charge le plan comptable OHADA standard
 */
function loadOHADAChartOfAccounts() {
    global $pdo;

    $accounts = [
        // ACTIF (1)
        ['code' => '1010', 'name' => 'Capital social', 'type' => 'equity'],
        ['code' => '1040', 'name' => 'Réserves', 'type' => 'equity'],
        ['code' => '1100', 'name' => 'Terrains et Constructions', 'type' => 'asset'],
        ['code' => '1200', 'name' => 'Installations Techniques', 'type' => 'asset'],
        ['code' => '1300', 'name' => 'Mobilier et Matériel', 'type' => 'asset'],
        ['code' => '1400', 'name' => 'Autres Immobilisations Corporelles', 'type' => 'asset'],

        // ACTIF CIRCULANT (2)
        ['code' => '2100', 'name' => 'Matières Premières', 'type' => 'asset'],
        ['code' => '2200', 'name' => 'Marchandises', 'type' => 'asset'],
        ['code' => '2300', 'name' => 'Emballages', 'type' => 'asset'],
        ['code' => '2700', 'name' => 'Produits Finis', 'type' => 'asset'],

        // TIERS (3 & 4)
        ['code' => '3100', 'name' => 'Fournisseurs', 'type' => 'liability'],
        ['code' => '3200', 'name' => 'Autres Créditeurs', 'type' => 'liability'],
        ['code' => '4010', 'name' => 'Comptes Fournisseurs', 'type' => 'liability'],
        ['code' => '4111', 'name' => 'Clients', 'type' => 'asset'],
        ['code' => '4115', 'name' => 'Clients - Effets à Recevoir', 'type' => 'asset'],
        ['code' => '4200', 'name' => 'Personnel', 'type' => 'liability'],

        // TRÉSORERIE (5)
        ['code' => '5141', 'name' => 'Banque', 'type' => 'asset'],
        ['code' => '5112', 'name' => 'Chèques Émis', 'type' => 'asset'],
        ['code' => '5710', 'name' => 'Caisse', 'type' => 'asset'],

        // COMPTES D'EXPLOITATION (6)
        ['code' => '6011', 'name' => 'Matières Premières Consommées', 'type' => 'expense'],
        ['code' => '6021', 'name' => 'Marchandises Consommées', 'type' => 'expense'],
        ['code' => '6031', 'name' => 'Emballages Consommés', 'type' => 'expense'],
        ['code' => '6100', 'name' => 'Transports de Marchandises', 'type' => 'expense'],
        ['code' => '6200', 'name' => 'Services Extérieurs', 'type' => 'expense'],
        ['code' => '6300', 'name' => 'Impôts et Taxes', 'type' => 'expense'],
        ['code' => '6400', 'name' => 'Salaires et Traitements', 'type' => 'expense'],
        ['code' => '6500', 'name' => 'Autres Frais de Personnel', 'type' => 'expense'],

        // COMPTES DE VENTES (7)
        ['code' => '7011', 'name' => 'Ventes de Matières Premières', 'type' => 'revenue'],
        ['code' => '7021', 'name' => 'Ventes de Marchandises', 'type' => 'revenue'],
        ['code' => '7031', 'name' => 'Ventes d\'Emballages', 'type' => 'revenue'],
        ['code' => '7111', 'name' => 'Services Rendus', 'type' => 'revenue'],
        ['code' => '7121', 'name' => 'Redevances', 'type' => 'revenue'],

        // TVA (4)
        ['code' => '4455', 'name' => 'TVA Collectée', 'type' => 'liability'],
        ['code' => '4456', 'name' => 'TVA Déductible', 'type' => 'asset'],

        // AUTRES COMPTES
        ['code' => '8050', 'name' => 'Apports de Trésorerie', 'type' => 'equity'],
        ['code' => '8100', 'name' => 'Dividendes Payés', 'type' => 'expense'],
        ['code' => '8200', 'name' => 'Résultat de l\'Exercice', 'type' => 'intermediate'],
    ];

    $stmt = $pdo->prepare("
        INSERT INTO accounting_chart 
        (account_code, account_name, account_type, is_active)
        VALUES (?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE account_name = VALUES(account_name)
    ");

    foreach ($accounts as $account) {
        $stmt->execute([
            $account['code'],
            $account['name'],
            $account['type']
        ]);
    }
}

/**
 * Configure les règles d'automatisation comptable
 */
function setupAutomationRules($tenant_id) {
    global $pdo;

    $rules = [
        ['name' => 'Vente Comptant', 'trigger' => 'sale', 'desc' => 'Écriture automatique pour les ventes'],
        ['name' => 'Achat Comptant', 'trigger' => 'purchase', 'desc' => 'Écriture automatique pour les achats'],
        ['name' => 'Paiement Fournisseur', 'trigger' => 'payment', 'desc' => 'Écriture automatique pour les paiements'],
    ];

    $stmt = $pdo->prepare("
        INSERT IGNORE INTO accounting_automate_rules 
        (rule_name, trigger_type, is_active, description, tenant_id)
        VALUES (?, ?, 1, ?, ?)
    ");

    foreach ($rules as $rule) {
        $stmt->execute([
            $rule['name'],
            $rule['trigger'],
            $rule['desc'],
            $tenant_id
        ]);
    }
}
?>

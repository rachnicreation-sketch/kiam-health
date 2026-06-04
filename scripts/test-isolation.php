#!/usr/bin/env php
<?php

/**
 * Script de Test d'Isolation Multi-Tenant
 * 
 * Utilisation :
 *   php artisan tinker < tests/isolation-test.php
 * 
 * OU
 * 
 *   php scripts/test-isolation.php
 */

use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║          TEST D'ISOLATION MULTI-TENANT KIAM                   ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1 : Vérifier la présence de tenant_id dans les tables
// ═══════════════════════════════════════════════════════════════════════════

echo "📋 TEST 1: Vérifier la présence de tenant_id dans les tables\n";
echo "─────────────────────────────────────────────────────────────\n";

$tables = ['users', 'articles', 'suppliers', 'warehouses', 'patients', 'students'];
$tenantColumnsFound = 0;
$tenantColumnsMissing = 0;

foreach ($tables as $table) {
    if (Schema::hasTable($table)) {
        if (Schema::hasColumn($table, 'tenant_id')) {
            echo "✓ Table '{$table}' possède colonne tenant_id\n";
            $tenantColumnsFound++;
        } else {
            echo "✗ Table '{$table}' MANQUE colonne tenant_id ⚠\n";
            $tenantColumnsMissing++;
        }
    } else {
        echo "⊘ Table '{$table}' n'existe pas\n";
    }
}

echo "\nRésumé: {$tenantColumnsFound} ✓ | {$tenantColumnsMissing} ✗\n\n";

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2 : Vérifier les tenants existants
// ═══════════════════════════════════════════════════════════════════════════

echo "📋 TEST 2: Vérifier les tenants existants\n";
echo "─────────────────────────────────────────\n";

$tenants = DB::table('kiam_tenants')->select(['id', 'name', 'sector'])->get();

if ($tenants->isEmpty()) {
    echo "✗ Aucun tenant trouvé dans kiam_tenants\n\n";
} else {
    echo "Tenants trouvés :\n";
    foreach ($tenants as $tenant) {
        echo "  • {$tenant->id} (Secteur: {$tenant->sector}, Nom: {$tenant->name})\n";
    }
    echo "\n";
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3 : Tester le trait TenantIsolated (si disponible)
// ═══════════════════════════════════════════════════════════════════════════

echo "📋 TEST 3: Tester le trait TenantIsolated\n";
echo "──────────────────────────────────────────\n";

try {
    // Vérifier si la classe User a le trait
    $userReflection = new ReflectionClass(User::class);
    $traits = array_keys($userReflection->getTraits());
    
    if (in_array('App\\Traits\\TenantIsolated', $traits)) {
        echo "✓ User model utilise le trait TenantIsolated\n";
    } else {
        echo "✗ User model n'utilise PAS le trait TenantIsolated\n";
    }
} catch (Exception $e) {
    echo "⚠ Erreur lors de vérification du trait: {$e->getMessage()}\n";
}

echo "\n";

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4 : Vérifier les données d'exemple
// ═══════════════════════════════════════════════════════════════════════════

echo "📋 TEST 4: État des données\n";
echo "────────────────────────────\n";

$dataStats = [
    'users' => DB::table('users')->count(),
    'articles' => DB::table('articles')->count(),
    'suppliers' => DB::table('suppliers')->count(),
    'warehouses' => DB::table('warehouses')->count(),
];

foreach ($dataStats as $table => $count) {
    echo "  • Table '{$table}': {$count} enregistrements\n";
}

echo "\n";

// ═══════════════════════════════════════════════════════════════════════════
// TEST 5 : Vérifier la répartition par tenant
// ═══════════════════════════════════════════════════════════════════════════

echo "📋 TEST 5: Répartition des données par tenant\n";
echo "─────────────────────────────────────────────\n";

if (Schema::hasColumn('users', 'tenant_id')) {
    $usersByTenant = DB::table('users')
        ->select('tenant_id', DB::raw('COUNT(*) as count'))
        ->groupBy('tenant_id')
        ->get();

    if ($usersByTenant->isEmpty()) {
        echo "⚠ Aucun utilisateur avec tenant_id\n";
    } else {
        echo "Utilisateurs par tenant:\n";
        foreach ($usersByTenant as $row) {
            $tenantId = $row->tenant_id ?? 'NULL';
            echo "  • Tenant '{$tenantId}': {$row->count} utilisateurs\n";
        }
    }
} else {
    echo "⚠ Colonne tenant_id n'existe pas dans la table users\n";
}

echo "\n";

// ═══════════════════════════════════════════════════════════════════════════
// TEST 6 : Vérifier les indices de performance
// ═══════════════════════════════════════════════════════════════════════════

echo "📋 TEST 6: Indices de performance sur tenant_id\n";
echo "───────────────────────────────────────────────\n";

$indexTables = ['users', 'articles', 'suppliers', 'warehouses'];
$indexesFound = 0;
$indexesMissing = 0;

foreach ($indexTables as $table) {
    if (Schema::hasTable($table) && Schema::hasColumn($table, 'tenant_id')) {
        // Récupérer les indices de la table
        $indexes = DB::select("SHOW INDEXES FROM {$table} WHERE Column_name = 'tenant_id'");
        
        if (count($indexes) > 0) {
            echo "✓ Table '{$table}' possède un index sur tenant_id\n";
            $indexesFound++;
        } else {
            echo "⚠ Table '{$table}' MANQUE index sur tenant_id (impact performance)\n";
            $indexesMissing++;
        }
    }
}

echo "\nRésumé indices: {$indexesFound} ✓ | {$indexesMissing} ⚠\n\n";

// ═══════════════════════════════════════════════════════════════════════════
// TEST 7 : Tester les routes protégées
// ═══════════════════════════════════════════════════════════════════════════

echo "📋 TEST 7: Vérifier le middleware TenantIsolation\n";
echo "────────────────────────────────────────────────\n";

// Vérifier que la classe existe
if (class_exists('App\\Http\\Middleware\\TenantIsolation')) {
    echo "✓ Middleware TenantIsolation existe\n";
} else {
    echo "✗ Middleware TenantIsolation n'existe pas\n";
}

// Vérifier que le trait existe
if (class_exists('App\\Traits\\TenantIsolated')) {
    echo "✓ Trait TenantIsolated existe\n";
} else {
    echo "✗ Trait TenantIsolated n'existe pas\n";
}

echo "\n";

// ═══════════════════════════════════════════════════════════════════════════
// RÉSUMÉ FINAL
// ═══════════════════════════════════════════════════════════════════════════

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                    RÉSUMÉ DES TESTS                           ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

$summary = [
    'Colonnes tenant_id' => ($tenantColumnsMissing === 0 ? '✓ OK' : "✗ {$tenantColumnsMissing} manquantes"),
    'Tenants configurés' => ($tenants->count() > 0 ? "✓ {$tenants->count()} tenants" : '✗ Aucun tenant'),
    'Trait TenantIsolated' => (class_exists('App\\Traits\\TenantIsolated') ? '✓ Existe' : '✗ Manquant'),
    'Middleware d\'isolation' => (class_exists('App\\Http\\Middleware\\TenantIsolation') ? '✓ Existe' : '✗ Manquant'),
    'Indices de performance' => ($indexesMissing === 0 ? '✓ OK' : "⚠ {$indexesMissing} manquants"),
];

foreach ($summary as $item => $status) {
    echo "  {$item}: {$status}\n";
}

echo "\n";

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMANDATIONS
// ═══════════════════════════════════════════════════════════════════════════

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                  RECOMMANDATIONS                              ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

$recommendations = [];

if ($tenantColumnsMissing > 0) {
    $recommendations[] = "1. Exécuter la migration: php artisan migrate --step";
}

if (Schema::hasColumn('users', 'tenant_id')) {
    $nullTenants = DB::table('users')->whereNull('tenant_id')->count();
    if ($nullTenants > 0) {
        $recommendations[] = "2. Peupler les tenant_id pour {$nullTenants} utilisateurs sans tenant";
    }
}

if ($indexesMissing > 0) {
    $recommendations[] = "3. Ajouter des indices sur tenant_id pour améliorer les performances";
}

if (!class_exists('App\\Traits\\TenantIsolated')) {
    $recommendations[] = "4. Créer le trait TenantIsolated selon le guide d'implémentation";
}

if (!class_exists('App\\Http\\Middleware\\TenantIsolation')) {
    $recommendations[] = "5. Créer le middleware TenantIsolation selon le guide d'implémentation";
}

if (empty($recommendations)) {
    echo "✓ Aucune recommandation - l'architecture semble bien configurée!\n";
} else {
    foreach ($recommendations as $rec) {
        echo "  {$rec}\n";
    }
}

echo "\n";

// ═══════════════════════════════════════════════════════════════════════════
// PROCHAINES ÉTAPES
// ═══════════════════════════════════════════════════════════════════════════

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                PROCHAINES ÉTAPES                              ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

echo "1. Appliquer le trait TenantIsolated à tous les modèles\n";
echo "   Exemple dans app/Models/Article.php:\n";
echo "   use App\\Traits\\TenantIsolated;\n\n";

echo "2. Enregistrer le middleware dans bootstrap/app.php\n";
echo "   Route::middleware(['auth:sanctum', TenantIsolation::class])->group(...);\n\n";

echo "3. Tester les scénarios d'isolation (voir IMPLEMENTATION_GUIDE.md)\n\n";

echo "4. Déployer graduellement sur les tenants existants\n\n";

echo "✅ Tests terminés!\n\n";

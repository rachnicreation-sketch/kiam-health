/**
 * GUIDE D'IMPLÉMENTATION - ISOLATION MULTI-TENANT KIAM
 * 
 * Ce guide explique comment intégrer les 6 fichiers de solution dans votre architecture existante
 * pour atteindre une isolation complète des tenants.
 * 
 * Durée estimée : 4-6 heures selon la taille du projet
 * Risque : Moyen (refactorisation majeure, test indispensable)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * PHASE 0 : PRÉPARATION
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

// 0.1. Créer un backup de la base de données
// bash: mysqldump -u root kiam_saas > backup_$(date +%Y%m%d_%H%M%S).sql

// 0.2. Créer une branche Git dédiée
// bash: git checkout -b feature/tenant-isolation-overhaul

// 0.3. Vérifier les dépendances Laravel
// package-reqs:
//   - laravel/framework: ^11.31 (déjà installé)
//   - spatie/laravel-permission: ^6.24 (déjà installé)
//   - firebase/php-jwt: ^6.0 (peut nécessiter composer require)

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * PHASE 1 : INTÉGRATION DES FICHIERS DE SOLUTION
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

// 1.1. CRÉER LA CONFIGURATION DES MODULES (src/config/tenant-modules.ts)
// 
// ✅ DÉJÀ CRÉÉ - Contient :
//   - Configuration de tous les tenants (health, erp, school, hotel, pharmacy, enterprise)
//   - Modules disponibles pour chaque tenant
//   - Thèmes et couleurs par tenant
//   - Fonctions de validation et d'accès
//
// 📌 À VÉRIFIER :
//   - Les chemins d'import des modules React correspondent à votre structure
//   - Les couleurs correspondent à votre charte graphique
//   - Les modules listés incluent tous vos modules métier

// 1.2. CRÉER LE TRAIT D'ISOLATION (app/Traits/TenantIsolated.php)
//
// ✅ DÉJÀ CRÉÉ - Contient :
//   - Global scope de filtrage automatique par tenant_id
//   - Extraction du tenant_id du JWT
//   - Trait bootable pour application automatique
//
// 📌 À FAIRE :
//   - Installer firebase/php-jwt si nécessaire :
//     composer require firebase/php-jwt:^6.0
//   - Adapter getTenantId() si votre JWT utilise une clé différente

// 1.3. CRÉER LE MIDDLEWARE (app/Http/Middleware/TenantIsolation.php)
//
// ✅ DÉJÀ CRÉÉ - Contient :
//   - Validation stricte du tenant au niveau HTTP
//   - Détection des tentatives cross-tenant
//   - Logging de sécurité
//
// 📌 À ENREGISTRER dans bootstrap/app.php :
//   voir ÉTAPE 3.1

// 1.4. CRÉER LES HOOKS REACT (src/hooks/useTenantModules.ts, useTenantTheme.ts)
//
// ✅ DÉJÀ CRÉÉS - Contiennent :
//   - Chargement dynamique des modules par tenant
//   - Validation des permissions
//   - Gestion des thèmes et couleurs
//
// 📌 À UTILISER :
//   - Importer dans vos composants : import { useTenantModules } from '@/hooks/useTenantModules'
//   - Remplacer les imports statiques de modules

// 1.5. CRÉER LE ROUTEUR DYNAMIQUE (src/components/DynamicModuleRouter.tsx)
//
// ✅ DÉJÀ CRÉÉ - Contient :
//   - Wrapper de protection des routes
//   - Chargement dynamique avec Suspense
//   - Validation des paths
//
// 📌 À INTÉGRER :
//   - Dans src/App.tsx (voir étape 3.2)

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * PHASE 2 : PRÉPARATION DE LA BASE DE DONNÉES
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

// 2.1. CRÉER LA MIGRATION POUR AJOUTER tenant_id AUX TABLES
//
// CRÉER LE FICHIER :
// database/migrations/2026_06_04_add_tenant_isolation.php

const migrationContent = `<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tables principales qui doivent être isolées par tenant
        $tables = [
            'users', 'articles', 'suppliers', 'warehouses', 'stock_movements',
            'inventories', 'inventory_lines', 'categories', 'alerts', 'audit_logs',
            'purchase_orders', 'purchase_order_items'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'tenant_id')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->string('tenant_id')->nullable()->after('id')->index();
                });
            }
        }

        // Ajouter une contrainte de clé étrangère
        if (Schema::hasTable('users') && Schema::hasTable('kiam_tenants')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('tenant_id')
                    ->references('id')
                    ->on('kiam_tenants')
                    ->onDelete('cascade')
                    ->onUpdate('cascade');
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'users', 'articles', 'suppliers', 'warehouses', 'stock_movements',
            'inventories', 'inventory_lines', 'categories', 'alerts', 'audit_logs',
            'purchase_orders', 'purchase_order_items'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    // Supprimer la contrainte si elle existe
                    try {
                        $table->dropForeign(['tenant_id']);
                    } catch (\\Exception $e) {}
                    $table->dropColumn('tenant_id');
                });
            }
        }
    }
};`;

// Exécuter la migration :
// php artisan migrate

// 2.2. PEUPLER tenant_id AVEC LES DONNÉES EXISTANTES
//
// Via Laravel tinker :
// php artisan tinker

const populateCode = `
// Pour les utilisateurs Health (sector = 'health')
\\App\\Models\\User::whereNull('tenant_id')
    ->whereIn('clinic_id', \\DB::table('kiam_tenants')->where('sector', 'health')->pluck('id'))
    ->update(['tenant_id' => \\DB::raw('clinic_id')]);

// Pour les articles/suppliers/warehouses ERP
\\App\\Models\\Article::whereNull('tenant_id')->update(['tenant_id' => 'erp-default']);
// (adapter selon votre logique d'association)
`;

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * PHASE 3 : INTÉGRATION DANS LARAVEL ET REACT
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

// 3.1. ENREGISTRER LE MIDDLEWARE DANS bootstrap/app.php
//
// REMPLACER : 
// Ouvrir : bootstrap/app.php
//
// TROUVER :
//   ->withMiddleware(function (Middleware $middleware) {
//       // ...
//   })
//
// AJOUTER DANS LE BLOC withMiddleware() :
//
// $middleware->api([
//     \App\Http\Middleware\TenantIsolation::class,
// ]);

// 3.2. REFACTORISER routes/api.php
//
// OBJECTIF : Grouper les routes par tenant
//
// REMPLACER LA STRUCTURE ACTUELLE PAR :

const routeExample = `<?php
use Illuminate\\Support\\Facades\\Route;

// ──────────────────────────────────────────────────────────────
// ROUTES PUBLIQUES (pas d'authentification requise)
// ──────────────────────────────────────────────────────────────
Route::post('/login', [\\App\\Http\\Controllers\\AuthController::class, 'login']);
Route::post('/register', [\\App\\Http\\Controllers\\AuthController::class, 'register']);
Route::get('/health', function () { return ['status' => 'ok']; });

// ──────────────────────────────────────────────────────────────
// ROUTES PROTÉGÉES (authentification requise)
// ISOLÉES PAR TENANT via middleware TenantIsolation
// ──────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', \\App\\Http\\Middleware\\TenantIsolation::class])
    ->group(function () {
        Route::post('/logout', [\\App\\Http\\Controllers\\AuthController::class, 'logout']);
        Route::get('/me', [\\App\\Http\\Controllers\\AuthController::class, 'me']);

        // ──── ERP MODULE ────
        Route::prefix('erp')->group(function () {
            Route::get('/dashboard/kpis', [\\App\\Http\\Controllers\\DashboardController::class, 'getKpis']);
            Route::apiResource('articles', \\App\\Http\\Controllers\\ArticleController::class);
            Route::apiResource('suppliers', \\App\\Http\\Controllers\\SupplierController::class);
            Route::apiResource('warehouses', \\App\\Http\\Controllers\\WarehouseController::class);
            // ... autres routes ERP
        });

        // ──── HEALTH MODULE ────
        Route::prefix('health')->group(function () {
            // Ajouter les routes Health ici
            // Route::apiResource('patients', ...);
            // Route::apiResource('consultations', ...);
        });

        // ──── SCHOOL MODULE ────
        Route::prefix('school')->group(function () {
            // Ajouter les routes School ici
        });

        // ... autres modules par tenant
    });`;

// 3.3. APPLIQUER LE TRAIT AUX MODÈLES ELOQUENT
//
// Pour chaque modèle qui doit être isolé par tenant (User, Article, etc.) :
//
// app/Models/Article.php :

const modelExample = `<?php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use App\\Traits\\TenantIsolated;

class Article extends Model
{
    use TenantIsolated;  // ← AJOUTER CETTE LIGNE
    
    protected $fillable = [
        'tenant_id',  // ← AJOUTER À fillable
        'nom',
        'code',
        // ... autres champs
    ];
}`;

// 3.4. REFACTORISER src/App.tsx
//
// REMPLACER L'ARCHITECTURE ACTUELLE :
//   - Tous les modules importés statiquement
//   - Toutes les routes existantes
//
// PAR :

const appTsxExample = `import React from "react";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { DynamicModuleRouter, useTenantRoutes } from "@/components/DynamicModuleRouter";

// Pages publiques
import Login from "./core/pages/Login";
import Register from "./core/pages/Register";
import LandingPage from "./core/pages/LandingPage";
import NotFound from "./core/pages/NotFound";

// Routes SaaS Admin (toujours visibles pour SaaS admins)
import SaaSAdminDashboard from "./core/pages/SaaSAdminDashboard";
import SaaSTenants from "./core/pages/saas/SaaSTenants";
// ... autres SaaS routes

const queryClient = new QueryClient();

function AppRoutes() {
  const tenantRoutes = useTenantRoutes();

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Routes protégées */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Routes SaaS Admin - toujours disponibles */}
        <Route path="/saas-admin" element={<SaaSAdminDashboard />} />
        <Route path="/saas-admin/tenants" element={<SaaSTenants />} />
        {/* ... autres SaaS routes */}

        {/* Routes tenant-spécifiques - chargées dynamiquement */}
        {tenantRoutes.map((route, idx) => (
          <Route key={idx} {...route} />
        ))}
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <DynamicModuleRouter>
            <AppRoutes />
          </DynamicModuleRouter>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}`;

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * PHASE 4 : MIGRATIONS DE DONNÉES
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

// 4.1. ASSOCIER LES DONNÉES EXISTANTES AUX TENANTS
//
// Créer une migration pour peupler tenant_id basé sur clinic_id :

const dataMigration = `<?php
use Illuminate\\Database\\Migrations\\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Récupérer tous les clinics et les associer à leurs tenants
        $clinics = \\DB::table('clinics')->get();
        foreach ($clinics as $clinic) {
            // Trouver le tenant correspondant
            $tenant = \\DB::table('kiam_tenants')->where('id', $clinic->id)->first();
            if ($tenant) {
                // Mettre à jour tous les records de cette clinic
                \\DB::table('users')->where('clinic_id', $clinic->id)
                    ->update(['tenant_id' => $tenant->id]);
                // ... autres tables
            }
        }
    }
};`;

// 4.2. CRÉER DES MODULES RH INDÉPENDANTS PAR TENANT
//
// ACTUELLEMENT : HumanResources est partagé entre health et erp
//
// À FAIRE :
//   ✓ Créer src/modules/health/pages/HealthHumanResources.tsx (copie spécialisée)
//   ✓ Créer src/modules/school/pages/SchoolHumanResources.tsx (copie spécialisée)
//   ✓ Mettre à jour tenant-modules.ts pour pointer vers chacun
//
// Chaque version peut avoir :
//   - Des champs différents (contrats médicaux vs. contrats scolaires)
//   - Des rapports spécifiques
//   - Des processus différents (recrutement, paie, congés)

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * PHASE 5 : TESTS ET VALIDATION
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

// 5.1. TESTS UNITAIRES POUR L'ISOLATION
//
// Créer : tests/Unit/TenantIsolationTest.php

const testExample = `<?php
namespace Tests\\Unit;

use Tests\\TestCase;
use App\\Models\\Article;

class TenantIsolationTest extends TestCase
{
    public function test_models_filter_by_tenant_id()
    {
        // Créer deux articles avec des tenant_id différents
        \\DB::table('articles')->insert([
            ['id' => 'ART-1', 'tenant_id' => 'erp', 'nom' => 'Article ERP'],
            ['id' => 'ART-2', 'tenant_id' => 'health', 'nom' => 'Article Health']
        ]);

        // Activer le contexte ERP
        \\Auth::loginUsingId('erp-admin'); // Utilisateur ERP

        // Vérifier que seul l'article ERP est visible
        \$articles = Article::all();
        \$this->assertEquals(1, \$articles->count());
        \$this->assertEquals('ART-1', \$articles->first()->id);
    }

    public function test_cross_tenant_access_denied()
    {
        // Vérifier qu'on ne peut pas accéder à un article d'un autre tenant
        \$response = \$this->getJson('/api/articles/ART-2');
        \$this->assertEquals(404, \$response->status());
    }
}`;

// Exécuter les tests :
// php artisan test

// 5.2. TESTS MANUELS - SCÉNARIOS CRITIQUES
//
// Scénario 1 : Accès croisé entre tenants
// ────────────────────────────────────────
// 1. Connexion avec user ERP
// 2. Tenter d'accéder à /health/patients → doit rediriger vers /erp
// 3. Tenter de modifier /api/articles?tenant_id=health → doit être rejetée
// 
// Scénario 2 : Visibilité des modules
// ────────────────────────────────────
// 1. Connexion avec user Health → menu ne montre que modules Health
// 2. Connexion avec user School → menu ne montre que modules School
// 3. Modules Health/ERP ne sont jamais chargés pour School
//
// Scénario 3 : Thèmes et identité
// ────────────────────────────────
// 1. Vérifier que couleurs correspondent à chaque tenant
// 2. Vérifier que logo s'affiche correctement
// 3. Vérifier que Dark mode s'applique correctement par tenant

// 5.3. LOGS ET MONITORING
//
// Vérifier les fichiers de log pour les tentatives suspectes :
// tail -f storage/logs/laravel.log | grep "Security Event"

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * PHASE 6 : DÉPLOIEMENT
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

// 6.1. CHECKLIST PRÉ-DÉPLOIEMENT
//
// ☐ Backup de la BD effectué
// ☐ Tests unitaires passent (php artisan test)
// ☐ Tests manuels réussis sur 3-4 tenants différents
// ☐ Logs de sécurité analysés
// ☐ Pas de console.warn/error pour accès croisé
// ☐ Performances acceptables (< 200ms par requête)
// ☐ Dark mode fonctionne correctement
// ☐ Utilisateurs SaaS Admin peuvent toujours accéder à tous les tenants
// ☐ Routes API sécurisées par TenantIsolation middleware
// ☐ Modules dynamiques se chargent correctement

// 6.2. DÉPLOIEMENT EN PRODUCTION
//
// 1. Mettre en maintenance :
//    php artisan down

// 2. Exécuter les migrations :
//    php artisan migrate --force

// 3. Peupler les tenant_id (si données existantes) :
//    php artisan tinker < populate_tenants.php

// 4. Reconstruire le cache :
//    php artisan optimize
//    php artisan config:cache
//    php artisan route:cache

// 5. Build du frontend :
//    npm run build

// 6. Sortir de la maintenance :
//    php artisan up

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * PHASE 7 : POST-DÉPLOIEMENT
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

// 7.1. MONITORING
//
// - Surveiller les logs pour les erreurs d'accès croisé
// - Vérifier les performances des requêtes
// - Monitorer l'utilisation des ressources

// 7.2. FEEDBACK UTILISATEURS
//
// - Chaque tenant doit voir uniquement ses modules
// - Pas d'accès aux données d'autres tenants
// - Thèmes appliqués correctement
// - Dark mode fonctionne bien

// 7.3. OPTIMISATIONS FUTURES
//
// - Ajouter du caching par tenant
// - Implémenter une queue pour les tâches longues par tenant
// - Ajouter des webhooks tenant-spécifiques
// - Créer des rapports d'isolation/sécurité

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * COMMANDES UTILES
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

// Créer une migration :
// php artisan make:migration add_tenant_isolation

// Exécuter les migrations :
// php artisan migrate

// Rollback les migrations :
// php artisan migrate:rollback

// Voir les logs :
// tail -f storage/logs/laravel.log

// Vider le cache :
// php artisan cache:clear
// php artisan config:clear
// php artisan route:clear

// Tester les routes :
// php artisan route:list | grep tenant

// Vérifier les modèles avec TenantIsolated :
// php artisan tinker
// >>> \App\\Models\\Article::all(); // Doit être filtré par tenant

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * SUPPORT ET DÉPANNAGE
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

// Problème : "Tenant ID non trouvé"
// Solution : Vérifier que le JWT include bien tenant_id, voir api/auth.php

// Problème : Les modules Health apparaissent dans le menu ERP
// Solution : Vérifier que useTenantModules hook est appelé, voir console.log

// Problème : "Unauthorized tenant access" en logs
// Solution : Vérifier que la requête a le bon Authorization header

// Problème : Performance réduite
// Solution : Ajouter des index sur tenant_id dans la BD
// SQL: ALTER TABLE articles ADD INDEX idx_tenant (tenant_id);

// Problème : Thème ne s'applique pas
// Solution : Vérifier que useTenantTheme est appelé dans AppLayout

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * RÉSUMÉ DES CHANGEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 *
 * FICHIERS CRÉÉS :
 * ✓ src/config/tenant-modules.ts - Configuration modules par tenant
 * ✓ app/Traits/TenantIsolated.php - Isolation automatique modèles
 * ✓ app/Http/Middleware/TenantIsolation.php - Isolation routes API
 * ✓ src/hooks/useTenantModules.ts - Hook chargement modules
 * ✓ src/hooks/useTenantTheme.ts - Hook thèmes tenant
 * ✓ src/components/DynamicModuleRouter.tsx - Routeur dynamique
 *
 * FICHIERS À MODIFIER :
 * • bootstrap/app.php - Enregistrer middleware
 * • routes/api.php - Grouper routes par tenant
 * • src/App.tsx - Utiliser DynamicModuleRouter
 * • app/Models/*.php - Utiliser TenantIsolated trait
 * • database/migrations/ - Ajouter colonne tenant_id
 *
 * RÉSULTATS :
 * ✓ Isolation complète des données par tenant
 * ✓ Modules dynamiques selon le secteur
 * ✓ Thèmes personnalisés par tenant
 * ✓ Dark mode amélioré
 * ✓ Accès sécurisé aux ressources
 * ✓ Logs de sécurité complets
 * ✓ Module RH indépendant par tenant
 *
 * TEMPS ESTIMÉ :
 * Phase 1 (Intégration fichiers) : 30 min
 * Phase 2 (Préparation BD) : 1 h
 * Phase 3 (Intégration code) : 2 h
 * Phase 4 (Migrations données) : 1 h
 * Phase 5 (Tests) : 1-2 h
 * Phase 6 (Déploiement) : 30 min
 * ─────────────────────────────────
 * TOTAL : 6-7 heures
 */

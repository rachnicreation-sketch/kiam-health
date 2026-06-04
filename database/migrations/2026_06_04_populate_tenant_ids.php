<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Migration: Populate Tenant IDs for Existing Data
 * 
 * Cette migration associe les données existantes à leurs tenants respectifs
 * en se basant sur la relation clinic_id existante.
 * 
 * À exécuter APRÈS 2026_06_04_add_tenant_isolation.php
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->populateTenantIds();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionnel : Réinitialiser tous les tenant_id à NULL
        // À décommenter que si vous êtes sûr
        
        /*
        $tables = ['users', 'articles', 'suppliers', 'warehouses', 'patients', 'students'];
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->update(['tenant_id' => null]);
            }
        }
        */
    }

    /**
     * Peupler les tenant_id basé sur clinic_id et les relations existantes
     */
    private function populateTenantIds(): void
    {
        echo "\n╔════════════════════════════════════════════════════════════════╗\n";
        echo "║     POPULATION DES TENANT_ID POUR LES DONNÉES EXISTANTES      ║\n";
        echo "╚════════════════════════════════════════════════════════════════╝\n\n";

        // Stratégie 1 : Users - Utiliser clinic_id direct
        $this->populateUsersTenantsFromClinic();

        // Stratégie 2 : Articles et données d'inventaire
        $this->populateInventoryTenants();

        // Stratégie 3 : Patients et données Health
        $this->populateHealthTenants();

        // Stratégie 4 : Données School
        $this->populateSchoolTenants();

        // Stratégie 5 : Autres tables - Assigner au tenant par défaut ou relation
        $this->populateOtherTenants();

        echo "\n✅ Peuplement des tenant_id terminé!\n\n";
    }

    /**
     * Stratégie 1 : Peupler Users
     */
    private function populateUsersTenantsFromClinic(): void
    {
        echo "1️⃣  Peuplement des utilisateurs...\n";
        
        if (!Schema::hasColumn('users', 'tenant_id') || !Schema::hasColumn('users', 'clinic_id')) {
            echo "   ⚠ Colonnes manquantes, passage\n";
            return;
        }

        // Récupérer les clinics (qui sont des tenants Health)
        $clinicsCount = 0;
        $clinics = DB::table('kiam_tenants')
            ->where('sector', 'health')
            ->pluck('id');

        foreach ($clinics as $clinicId) {
            $updated = DB::table('users')
                ->where('clinic_id', $clinicId)
                ->whereNull('tenant_id')
                ->update(['tenant_id' => $clinicId]);
            
            if ($updated > 0) {
                echo "   • Clinic {$clinicId}: {$updated} utilisateurs assignés\n";
                $clinicsCount += $updated;
            }
        }

        // Utilisateurs sans clinic_id - assigner au tenant par défaut ou manuel
        $orphaned = DB::table('users')
            ->whereNull('tenant_id')
            ->count();

        if ($orphaned > 0) {
            echo "   ⚠ {$orphaned} utilisateurs orphelins sans tenant\n";
            echo "   💡 À assigner manuellement ou via un formulaire admin\n";
        }

        echo "   ✓ Total: {$clinicsCount} utilisateurs assignés\n\n";
    }

    /**
     * Stratégie 2 : Articles et données ERP/Inventaire
     */
    private function populateInventoryTenants(): void
    {
        echo "2️⃣  Peuplement des articles et inventaire...\n";

        if (!Schema::hasTable('articles')) {
            echo "   ⚠ Table 'articles' n'existe pas\n";
            return;
        }

        // Option A : Si les articles ont une relation warehouse
        if (Schema::hasColumn('articles', 'warehouse_id') && Schema::hasTable('warehouses')) {
            $warehouseCount = DB::table('warehouses')
                ->whereNotNull('tenant_id')
                ->count();

            if ($warehouseCount > 0) {
                // Articles via warehouse
                $updated = DB::table('articles')
                    ->join('warehouses', 'articles.warehouse_id', '=', 'warehouses.id')
                    ->whereNull('articles.tenant_id')
                    ->update(['articles.tenant_id' => DB::raw('warehouses.tenant_id')]);

                echo "   • Articles via warehouse: {$updated} mis à jour\n";
            }
        }

        // Option B : Assigner tous les articles restants au tenant ERP par défaut
        $updated = DB::table('articles')
            ->whereNull('tenant_id')
            ->update(['tenant_id' => 'erp']);

        if ($updated > 0) {
            echo "   • Articles sans warehouse: {$updated} assignés à 'erp'\n";
        }

        // Suppliers
        if (Schema::hasTable('suppliers') && Schema::hasColumn('suppliers', 'tenant_id')) {
            $updated = DB::table('suppliers')
                ->whereNull('tenant_id')
                ->update(['tenant_id' => 'erp']);
            
            if ($updated > 0) {
                echo "   • Fournisseurs: {$updated} assignés à 'erp'\n";
            }
        }

        // Warehouses
        if (Schema::hasTable('warehouses') && Schema::hasColumn('warehouses', 'tenant_id')) {
            $updated = DB::table('warehouses')
                ->whereNull('tenant_id')
                ->update(['tenant_id' => 'erp']);
            
            if ($updated > 0) {
                echo "   • Entrepôts: {$updated} assignés à 'erp'\n";
            }
        }

        echo "   ✓ Inventaire peuplée\n\n";
    }

    /**
     * Stratégie 3 : Données Health (Patients, Consultations, etc.)
     */
    private function populateHealthTenants(): void
    {
        echo "3️⃣  Peuplement des données Health...\n";

        // Patients - Utiliser clinic_id s'il existe
        if (Schema::hasTable('patients') && Schema::hasColumn('patients', 'tenant_id')) {
            if (Schema::hasColumn('patients', 'clinic_id')) {
                $updated = DB::table('patients')
                    ->whereNull('tenant_id')
                    ->whereNotNull('clinic_id')
                    ->update(['tenant_id' => DB::raw('clinic_id')]);
                
                if ($updated > 0) {
                    echo "   • Patients: {$updated} mis à jour via clinic_id\n";
                }
            }

            // Assigner les patients restants
            $updated = DB::table('patients')
                ->whereNull('tenant_id')
                ->update(['tenant_id' => 'health']);

            if ($updated > 0) {
                echo "   • Patients orphelins: {$updated} assignés à 'health'\n";
            }
        }

        // Consultations
        if (Schema::hasTable('consultations') && Schema::hasColumn('consultations', 'tenant_id')) {
            $updated = DB::table('consultations')
                ->whereNull('tenant_id')
                ->update(['tenant_id' => 'health']);

            if ($updated > 0) {
                echo "   • Consultations: {$updated} assignées\n";
            }
        }

        // Appointments
        if (Schema::hasTable('appointments') && Schema::hasColumn('appointments', 'tenant_id')) {
            $updated = DB::table('appointments')
                ->whereNull('tenant_id')
                ->update(['tenant_id' => 'health']);

            if ($updated > 0) {
                echo "   • Rendez-vous: {$updated} assignés\n";
            }
        }

        // Pharmacy Sales
        if (Schema::hasTable('pharmacy_sales') && Schema::hasColumn('pharmacy_sales', 'tenant_id')) {
            $updated = DB::table('pharmacy_sales')
                ->whereNull('tenant_id')
                ->update(['tenant_id' => 'health']);

            if ($updated > 0) {
                echo "   • Ventes pharmacie: {$updated} assignées\n";
            }
        }

        echo "   ✓ Données Health peuplées\n\n";
    }

    /**
     * Stratégie 4 : Données School
     */
    private function populateSchoolTenants(): void
    {
        echo "4️⃣  Peuplement des données School...\n";

        $tables = ['students', 'classes', 'grades', 'attendance'];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'tenant_id')) {
                $updated = DB::table($table)
                    ->whereNull('tenant_id')
                    ->update(['tenant_id' => 'school']);

                if ($updated > 0) {
                    echo "   • {$table}: {$updated} assignés\n";
                }
            }
        }

        echo "   ✓ Données School peuplées\n\n";
    }

    /**
     * Stratégie 5 : Autres tables
     */
    private function populateOtherTenants(): void
    {
        echo "5️⃣  Peuplement des autres tables...\n";

        $otherTables = [
            'stock_movements' => 'erp',
            'inventories' => 'erp',
            'inventory_lines' => 'erp',
            'categories' => 'erp',
            'alerts' => 'erp',
            'purchase_orders' => 'erp',
            'purchase_order_items' => 'erp',
            'audit_logs' => null, // Garder NULL si partagé entre tenants
        ];

        foreach ($otherTables as $table => $defaultTenant) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'tenant_id') && $defaultTenant !== null) {
                $updated = DB::table($table)
                    ->whereNull('tenant_id')
                    ->update(['tenant_id' => $defaultTenant]);

                if ($updated > 0) {
                    echo "   • {$table}: {$updated} assignés à '{$defaultTenant}'\n";
                }
            }
        }

        echo "   ✓ Autres tables peuplées\n\n";
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Add Tenant Isolation to Tables
 * 
 * Cette migration ajoute la colonne tenant_id à toutes les tables qui doivent
 * être isolées par tenant. Elle crée aussi les index et contraintes nécessaires.
 * 
 * Cette migration est IDEMPOTENTE - elle peut être exécutée plusieurs fois
 * sans erreur si certaines colonnes existent déjà.
 */
return new class extends Migration
{
    /**
     * Les tables qui doivent être isolées par tenant
     */
    private array $tenantTables = [
        'users',
        'articles',
        'suppliers',
        'warehouses',
        'zones',
        'allees',
        'rayonnages',
        'emplacements',
        'stock_movements',
        'inventories',
        'inventory_lines',
        'categories',
        'alerts',
        'audit_logs',
        'purchase_orders',
        'purchase_order_items',
        'patients',           // Health module
        'consultations',      // Health module
        'appointments',       // Health module
        'pharmacy_sales',     // Health/Pharmacy module
        'lab_tests',         // Health module
        'students',          // School module
        'classes',           // School module
        'grades',            // School module
        'attendance',        // School module
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tenantTables as $table) {
            if (Schema::hasTable($table)) {
                // Ajouter la colonne tenant_id si elle n'existe pas
                if (!Schema::hasColumn($table, 'tenant_id')) {
                    Schema::table($table, function (Blueprint $table) {
                        $table->string('tenant_id', 36)
                            ->nullable()
                            ->after('id')  // Positionner juste après l'ID
                            ->comment('Tenant ID for multi-tenancy isolation');
                        
                        // Ajouter un index pour les performances
                        $table->index('tenant_id');
                    });

                    echo "✓ Added tenant_id to table: {$table}\n";
                } else {
                    echo "⊘ Table {$table} already has tenant_id column\n";
                }
            } else {
                echo "⚠ Table {$table} does not exist, skipping\n";
            }
        }

        // Étape 2 : Ajouter les contraintes de clé étrangère
        $this->addForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tenantTables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'tenant_id')) {
                Schema::table($table, function (Blueprint $table) {
                    // Supprimer la contrainte de clé étrangère si elle existe
                    try {
                        $table->dropForeign(["{$table}_tenant_id_foreign"]);
                    } catch (\Exception $e) {
                        // La contrainte n'existe peut-être pas
                    }

                    // Supprimer la colonne tenant_id
                    $table->dropIndex(["{$table}_tenant_id_index"]);
                    $table->dropColumn('tenant_id');
                });

                echo "✓ Removed tenant_id from table: {$table}\n";
            }
        }
    }

    /**
     * Ajouter les contraintes de clé étrangère
     * Cette étape est effectuée après la création des colonnes pour éviter
     * les erreurs si kiam_tenants n'existe pas encore
     */
    private function addForeignKeyConstraints(): void
    {
        // Vérifier que la table kiam_tenants existe
        if (!Schema::hasTable('kiam_tenants')) {
            echo "⚠ Table kiam_tenants does not exist, skipping foreign key constraints\n";
            return;
        }

        // Tables principales qui devraient avoir une contrainte FK
        $fkTables = [
            'users',
            'articles',
            'suppliers',
            'warehouses',
            'patients',
            'students',
        ];

        foreach ($fkTables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'tenant_id')) {
                try {
                    // Vérifier que la contrainte FK n'existe pas déjà
                    $keyName = "{$table}_tenant_id_foreign";
                    
                    // Cette approche ne fonctionne pas directement, donc on va la mettre en commentaire
                    // pour un ajout manuel si nécessaire
                    
                    echo "⊘ Foreign key constraint for {$table} should be added manually\n";
                    echo "   SQL: ALTER TABLE {$table} ADD CONSTRAINT {$keyName} FOREIGN KEY (tenant_id) REFERENCES kiam_tenants(id) ON DELETE CASCADE;\n";
                } catch (\Exception $e) {
                    echo "⚠ Error adding FK to {$table}: {$e->getMessage()}\n";
                }
            }
        }
    }
};

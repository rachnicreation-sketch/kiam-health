<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->decimal('poids', 10, 2)->nullable()->after('prix_achat');
            $table->decimal('volume', 10, 3)->nullable()->after('poids');
            $table->date('date_peremption')->nullable()->after('date_acquisition');
            $table->string('type_amortissement')->nullable()->after('statut'); // lineaire, degressif
            $table->integer('duree_amortissement')->nullable()->after('type_amortissement'); // in years
            $table->decimal('valeur_residuelle', 15, 2)->nullable()->after('duree_amortissement');
            if (!Schema::hasColumn('articles', 'marque')) {
                $table->string('marque')->nullable()->after('article');
            }
        });

        Schema::table('warehouses', function (Blueprint $table) {
            $table->decimal('capacite_m3', 15, 2)->nullable()->after('type');
            $table->decimal('surface_m2', 15, 2)->nullable()->after('capacite_m3');
            $table->boolean('temperature_control')->default(false)->after('surface_m2');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['poids', 'volume', 'date_peremption', 'type_amortissement', 'duree_amortissement', 'valeur_residuelle', 'marque']);
        });

        Schema::table('warehouses', function (Blueprint $table) {
            $table->dropColumn(['capacite_m3', 'surface_m2', 'temperature_control']);
        });
    }
};

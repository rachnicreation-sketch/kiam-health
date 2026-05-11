<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->foreignId('warehouse_id')->nullable()->after('user_id')->constrained()->onDelete('restrict');
            $table->date('expected_arrival_date')->nullable()->after('reference');
            $table->string('carrier')->nullable()->after('notes');
            $table->string('tracking_number')->nullable()->after('carrier');
            $table->date('estimated_shipping_date')->nullable()->after('tracking_number');
            $table->date('estimated_delivery_date')->nullable()->after('estimated_shipping_date');
            
            // Re-defining enum in Laravel migration is tricky with existing data. 
            // We use DB::statement for reliability on MySQL/Wamp.
            DB::statement("ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('brouillon', 'valide', 'en_cours', 'recu_partiel', 'recu', 'annule') DEFAULT 'brouillon'");
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['warehouse_id']);
            $table->dropColumn(['warehouse_id', 'expected_arrival_date', 'carrier', 'tracking_number', 'estimated_shipping_date', 'estimated_delivery_date']);
            DB::statement("ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('brouillon', 'valide', 'recu', 'annule') DEFAULT 'brouillon'");
        });
    }
};

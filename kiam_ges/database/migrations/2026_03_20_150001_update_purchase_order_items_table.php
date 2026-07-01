<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->decimal('received_quantity', 15, 2)->default(0)->after('quantity');
            $table->string('batch_number')->nullable()->after('received_quantity');
            $table->date('expiry_date')->nullable()->after('batch_number');
            $table->string('serial_number')->nullable()->after('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropColumn(['received_quantity', 'batch_number', 'expiry_date', 'serial_number']);
        });
    }
};

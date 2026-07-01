<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('code')->unique();
            $table->enum('type', ['entrepot', 'magasin', 'depot', 'site_distant'])->default('entrepot');
            $table->string('adresse')->nullable();
            $table->string('ville')->nullable();
            $table->string('responsable')->nullable();
            $table->string('telephone')->nullable();
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('code');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('allees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zone_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('code');
            $table->timestamps();
        });

        Schema::create('rayonnages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('allee_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('code');
            $table->timestamps();
        });

        Schema::create('emplacements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rayonnage_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('code');
            $table->boolean('occupe')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emplacements');
        Schema::dropIfExists('rayonnages');
        Schema::dropIfExists('allees');
        Schema::dropIfExists('zones');
        Schema::dropIfExists('warehouses');
    }
};

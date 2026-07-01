<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('article');
            $table->string('reference')->unique();
            $table->string('code_barre')->nullable()->unique();
            $table->string('marque')->nullable();
            $table->string('categorie', 100)->nullable();
            $table->string('domaine_utilisation', 100)->nullable(); // département/service
            $table->date('date_acquisition')->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('numero_facture')->nullable();
            $table->decimal('prix_achat', 15, 2)->default(0);
            $table->integer('quantite_acquise')->default(0);
            $table->integer('quantite_utilisee')->default(0);
            $table->integer('quantite_reservee')->default(0);
            $table->integer('quantite_stock')->default(0); // calculated: acquise - utilisee - reservee
            $table->integer('stock_minimum')->default(0);
            $table->decimal('total', 15, 2)->default(0); // calculated: prix_achat * quantite_acquise
            $table->string('localisation')->nullable();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('emplacement_id')->nullable()->constrained('emplacements')->nullOnDelete();
            $table->enum('statut', ['actif', 'inactif', 'obsolete', 'rebut'])->default('actif');
            $table->string('image')->nullable();
            $table->text('observation')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['categorie', 'domaine_utilisation']);
            $table->index(['warehouse_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};

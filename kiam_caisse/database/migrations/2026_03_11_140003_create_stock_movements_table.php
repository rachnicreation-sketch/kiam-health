<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->enum('type', ['entree', 'sortie', 'transfert', 'ajustement'])->default('entree');
            $table->string('motif'); // acquisition, reception_fournisseur, retour, transfert, utilisation, distribution, perte, casse, rebut, inventaire
            $table->integer('quantite');
            $table->integer('quantite_avant')->default(0);
            $table->integer('quantite_apres')->default(0);
            $table->decimal('prix_unitaire', 15, 2)->nullable();
            $table->string('reference_doc')->nullable(); // no de bon, facture, etc.
            $table->string('destination')->nullable(); // service, personne
            $table->foreignId('warehouse_from')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('warehouse_to')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->date('date_mouvement');
            $table->timestamps();

            $table->index(['article_id', 'date_mouvement']);
            $table->index(['type', 'motif']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};

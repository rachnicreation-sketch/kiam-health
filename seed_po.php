<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Article;
use App\Models\User;

$supplier = Supplier::first();
$article = Article::first();
$user = User::first();

if(!$supplier) {
    // create dummy
    $supplier = Supplier::create([
        'name' => 'Fournisseur Test',
        'contact_name' => 'Jean Dupont',
        'email' => 'test@fournisseur.com',
        'phone' => '0000000'
    ]);
}

if(!$article) {
    $article = clone Article::first(); // Just in case, but they have articles.
}

if ($supplier && $article && $user) {
    $po = PurchaseOrder::create([
        'supplier_id' => $supplier->id,
        'user_id' => $user->id,
        'status' => 'brouillon',
        'total_amount' => ($article->prix_achat > 0 ? $article->prix_achat : 5000) * 10,
        'notes' => 'Commande de test initiale générée par le système.'
    ]);
    PurchaseOrderItem::create([
        'purchase_order_id' => $po->id,
        'article_id' => $article->id,
        'quantity' => 10,
        'unit_price' => $article->prix_achat > 0 ? $article->prix_achat : 5000,
        'total_price' => ($article->prix_achat > 0 ? $article->prix_achat : 5000) * 10
    ]);
    echo "Commande de test créée avec succès: " . $po->reference . "\n";
} else {
    echo "Impossible de créer la commande de test, données manquantes.\n";
}

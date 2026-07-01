<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use App\Http\Requests\StoreStockMovementRequest;
use App\Http\Requests\UpdateStockMovementRequest;

class StockMovementController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $query = StockMovement::query()->with(['article', 'user', 'warehouseFrom', 'warehouseTo']);

        if ($request->has('article_id') && $request->article_id) {
            $query->where('article_id', $request->article_id);
        }

        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        if ($request->has('category') && $request->category) {
            $query->whereHas('article', function($q) use ($request) {
                $q->where('categorie', $request->category);
            });
        }

        if ($request->has('domain') && $request->domain) {
            $query->whereHas('article', function($q) use ($request) {
                $q->where('domaine_utilisation', $request->domain);
            });
        }

        return $query->latest()->paginate(50); // Increased limit for better trace viewing
    }

    public function store(StoreStockMovementRequest $request)
    {
        $data = $request->validated();
        
        $article = \App\Models\Article::findOrFail($data['article_id']);
        
        $data['user_id'] = $request->user()->id;
        $data['date_mouvement'] = $data['date_mouvement'] ?? now();
        $data['quantite_avant'] = $article->quantite_stock;
        
        // Logic: The Article model's boot strategy now handles syncQuantities() on save.
        // We only need to check for stock availability if it's a 'sortie'.
        if ($data['type'] === 'sortie' && $article->quantite_stock < $data['quantite']) {
            return response()->json([
                'message' => "Stock insuffisant pour {$article->article}. Quantité disponible: {$article->quantite_stock}."
            ], 422);
        }

        $data['quantite_apres'] = ($data['type'] === 'entree') 
            ? $article->quantite_stock + $data['quantite'] 
            : $article->quantite_stock - $data['quantite'];

        $movement = \App\Models\StockMovement::create($data);

        // Stock Intelligence: Automate Alerts
        $article->refresh();
        if ($article->quantite_stock <= $article->stock_minimum) {
            \App\Models\Alert::updateOrCreate(
                [
                    'article_id' => $article->id,
                    'statut' => 'non_lu',
                    'type' => $article->quantite_stock <= 0 ? 'stock_rupture' : 'stock_bas'
                ],
                [
                    'message' => $article->quantite_stock <= 0 
                        ? "RUPTURE: L'article {$article->article} est épuisé." 
                        : "ALERTE: Stock bas pour {$article->article} ({$article->quantite_stock} restants).",
                    'user_id' => $request->user()->id
                ]
            );
        }

        return response()->json($movement, 201);
    }

    public function show(StockMovement $stockMovement)
    {
        return $stockMovement->load(['article', 'user', 'warehouseFrom', 'warehouseTo']);
    }

    public function update(UpdateStockMovementRequest $request, StockMovement $stockMovement)
    {
        // Movements are generally immutable for auditing, but allow updating notes
        $stockMovement->update($request->only(['notes', 'reference_doc']));
        return response()->json($stockMovement);
    }

    public function destroy(StockMovement $stockMovement)
    {
        // Prevent deleting movements to keep trace, strictly speaking. 
        // Or implement logic to reverse the impact. For now, returning 403.
        return response()->json(['message' => 'Les mouvements de stock ne peuvent pas être supprimés.'], 403);
    }
}

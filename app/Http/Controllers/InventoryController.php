<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Http\Requests\StoreInventoryRequest;
use App\Http\Requests\UpdateInventoryRequest;

class InventoryController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $query = Inventory::query()->with(['user', 'warehouse']);
        return $query->latest()->paginate(15);
    }

    public function show(Inventory $inventory)
    {
        return $inventory->load(['user', 'warehouse', 'lines.article']);
    }

    public function store(StoreInventoryRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        $data['statut'] = 'en_cours';
        $data['date_debut'] = now();
        $data['nom'] = $data['nom'] ?? $data['reference'];
        
        $inventory = Inventory::create($data);

        // Auto-populate lines with current theoretical stock
        $articles = \App\Models\Article::where('warehouse_id', $inventory->warehouse_id)->get();
        foreach ($articles as $article) {
            $inventory->lines()->create([
                'article_id' => $article->id,
                'qte_theorique' => $article->quantite_stock,
                'qte_reelle' => 0,
                'ecart' => -$article->quantite_stock,
            ]);
        }

        return response()->json($inventory->load('lines.article'), 201);
    }

    public function validateSession(Inventory $inventory)
    {
        if ($inventory->statut === 'cloture') {
            return response()->json(['message' => 'L\'inventaire est déjà clôturé.'], 403);
        }

        \Illuminate\Support\Facades\DB::transaction(function() use ($inventory) {
            foreach ($inventory->lines as $line) {
                if ($line->ecart != 0) {
                    $type = $line->ecart > 0 ? 'entree' : 'sortie';
                    
                    // Create adjustment movement
                    \App\Models\StockMovement::create([
                        'article_id' => $line->article_id,
                        'user_id' => auth()->id(),
                        'type' => $type,
                        'quantite' => abs($line->ecart),
                        'motif' => 'Ajustement Inventaire #' . $inventory->id,
                        'reference_document' => 'INV-' . $inventory->id
                    ]);

                    // Update Article Stock
                    $article = $line->article;
                    $article->quantite_stock = $line->qte_reelle;
                    $article->save();
                }
            }

            $inventory->update([
                'statut' => 'cloture',
                'date_fin' => now()
            ]);
        });

        return response()->json(['message' => 'Inventaire validé et stocks ajustés.']);
    }

    public function updateLine(\Illuminate\Http\Request $request, \App\Models\InventoryLine $line)
    {
        $request->validate(['quantite_physique' => 'required|numeric']);
        
        $qtyReelle = $request->quantite_physique;
        $line->update([
            'qte_reelle' => $qtyReelle,
            'ecart' => $qtyReelle - $line->qte_theorique
        ]);

        return response()->json($line);
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->lines()->delete();
        $inventory->delete();
        return response()->json(null, 204);
    }
}

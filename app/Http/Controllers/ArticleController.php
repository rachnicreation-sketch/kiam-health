<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Http\Requests\StoreArticleRequest;
use App\Http\Requests\UpdateArticleRequest;
use Illuminate\Database\Eloquent\Builder;

class ArticleController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $query = Article::query()->with(['supplier', 'warehouse', 'emplacement', 'category']);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function (\Illuminate\Database\Eloquent\Builder $q) use ($search) {
                $q->where('article', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhere('code_barre', 'like', "%{$search}%");
            });
        }

        if ($request->has('fournisseur_id') && $request->fournisseur_id) {
            $query->where('supplier_id', $request->fournisseur_id);
        }

        if ($request->has('categorie') && $request->categorie) {
            $query->where('categorie', $request->categorie);
        }

        if ($request->has('warehouse_id') && $request->warehouse_id) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('domaine_utilisation') && $request->domaine_utilisation) {
            $query->where('domaine_utilisation', $request->domaine_utilisation);
        }

        if ($request->has('emplacement_id') && $request->emplacement_id) {
            $query->where('emplacement_id', $request->emplacement_id);
        }

        if ($request->has('type') && $request->type) {
            if ($request->type === 'assets') {
                $query->whereHas('category', function($q) {
                    $q->where('type', 'patrimoine');
                });
            } elseif ($request->type === 'stocks') {
                $query->whereHas('category', function($q) {
                    $q->where('type', 'stock');
                });
            }
        }

        return $query->orderBy('article', 'asc')->paginate($request->get('per_page', 15));
    }

    /**
     * Stock overview: list articles with status (available, low, out), filtered.
     */
    public function stockOverview(\Illuminate\Http\Request $request)
    {
        $query = Article::query()->with(['warehouse', 'emplacement', 'category']);

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('article', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhere('code_barre', 'like', "%{$search}%");
            });
        }
        if ($request->warehouse_id) {
            $query->where('warehouse_id', $request->warehouse_id);
        }
        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->stock_status) {
            switch ($request->stock_status) {
                case 'rupture':
                    $query->where('quantite_stock', '<=', 0);
                    break;
                case 'faible':
                    $query->where('quantite_stock', '>', 0)
                          ->whereRaw('quantite_stock <= stock_minimum');
                    break;
                case 'disponible':
                    $query->whereRaw('quantite_stock > COALESCE(stock_minimum, 0)');
                    break;
            }
        }

        $articles = $query->orderBy('article', 'asc')->paginate($request->get('per_page', 20));

        // Append stock_status to each article
        $articles->getCollection()->transform(function ($a) {
            if ($a->quantite_stock <= 0) {
                $a->stock_status = 'rupture';
            } elseif ($a->stock_minimum > 0 && $a->quantite_stock <= $a->stock_minimum) {
                $a->stock_status = 'faible';
            } else {
                $a->stock_status = 'disponible';
            }
            $a->stock_value = round($a->quantite_stock * $a->prix_achat);
            return $a;
        });

        return response()->json($articles);
    }

    public function store(StoreArticleRequest $request)
    {
        $data = $request->validated();
        
        if (empty($data['code_barre'])) {
            $data['code_barre'] = 'ART-' . time() . '-' . rand(1000, 9999);
        }
        
        $data['prix_achat'] = isset($data['prix_achat']) ? (float)$data['prix_achat'] : 0;
        $data['quantite_acquise'] = isset($data['quantite_acquise']) ? (int)$data['quantite_acquise'] : 0;
        $data['quantite_utilisee'] = isset($data['quantite_utilisee']) ? (int)$data['quantite_utilisee'] : 0;
        $data['quantite_reservee'] = isset($data['quantite_reservee']) ? (int)$data['quantite_reservee'] : 0;
        $data['quantite_stock'] = $data['quantite_acquise'] - $data['quantite_utilisee'] - $data['quantite_reservee'];
        $data['total'] = $data['prix_achat'] * $data['quantite_acquise'];

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();
            $article = Article::create($data);

            // Create initial stock movement if quantity > 0 and user is logged in
            $userId = auth()->id();
            if ($data['quantite_acquise'] > 0 && $userId) {
                \App\Models\StockMovement::create([
                    'article_id'     => $article->id,
                    'user_id'        => $userId,
                    'type'           => 'entree',
                    'quantite'       => $data['quantite_acquise'],
                    'quantite_avant' => 0,
                    'quantite_apres' => $data['quantite_acquise'],
                    'date_mouvement' => $article->created_at,
                    'motif'          => 'acquisition',
                    'notes'          => 'Entrée initiale lors de la création de l\'article',
                    'warehouse_to'   => $article->warehouse_id,
                ]);
            }

            \Illuminate\Support\Facades\DB::commit();
            return response()->json($article->load('supplier', 'warehouse'), 201);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Article Creation Error: ' . $e->getMessage(), [
                'data'    => $data,
                'user_id' => auth()->id(),
            ]);
            return response()->json(['message' => 'Erreur lors de la création: ' . $e->getMessage()], 500);
        }
    }

    public function show(Article $article)
    {
        return $article->load(['supplier', 'warehouse', 'emplacement', 'stockMovements.user' => function($q) {
            $q->latest()->take(20);
        }]);
    }

    public function update(UpdateArticleRequest $request, Article $article)
    {
        $data = $request->validated();
        
        // Recalculate computed if needed
        if (isset($data['quantite_acquise']) || isset($data['quantite_utilisee']) || isset($data['quantite_reservee'])) {
            $qa = $data['quantite_acquise'] ?? $article->quantite_acquise;
            $qu = $data['quantite_utilisee'] ?? $article->quantite_utilisee;
            $qr = $data['quantite_reservee'] ?? $article->quantite_reservee;
            $data['quantite_stock'] = $qa - $qu - $qr;
            
            $prix = $data['prix_achat'] ?? $article->prix_achat;
            $data['total'] = $prix * $qa;
        }

        $article->update($data);

        return response()->json($article);
    }

    public function destroy(\Illuminate\Http\Request $request, Article $article)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Action réservée aux administrateurs.'], 403);
        }
        $article->delete();
        return response()->json(null, 204);
    }

    public function export()
    {
        $articles = Article::with(['supplier', 'warehouse'])->get();
        $filename = 'export_kiam_' . date('Y-m-d') . '.csv';
        
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['ID', 'Reference', 'Article', 'Marque', 'Categorie', 'Prix', 'Quantite', 'Entrepot', 'Statut'];

        $callback = function() use($articles, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($articles as $a) {
                fputcsv($file, [
                    $a->id,
                    $a->reference,
                    $a->article,
                    $a->marque,
                    $a->categorie,
                    $a->prix_achat,
                    $a->quantite_stock,
                    $a->warehouse?->nom,
                    $a->statut
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function getKpis(Request $request)
    {
        $warehouseId = $request->query('warehouse_id');
        $type = $request->query('type'); // 'all', 'assets', 'stocks'

        $query = \App\Models\Article::query();

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($type === 'assets') {
            $query->whereHas('category', function($q) {
                $q->where('type', 'patrimoine');
            });
        } elseif ($type === 'stocks') {
            $query->whereHas('category', function($q) {
                $q->where('type', 'stock');
            });
        }

        $articles = $query->get();
        $totalArticles = $articles->count();
        
        // Valeur des Biens (Patrimoine)
        $valeurBiens = $articles->filter(function($a) {
            return $a->category?->type === 'patrimoine';
        })->sum(function($a) {
            return $a->quantite_stock * $a->prix_achat;
        });

        // Valeur des Stocks
        $valeurStock = $articles->filter(function($a) {
            return $a->category?->type === 'stock' || !$a->category_id;
        })->sum(function($a) {
            return $a->quantite_stock * $a->prix_achat;
        });
        
        $articlesRupture = $articles->where('quantite_stock', '<=', 0)->count();

        // New Pro KPI: Global Occupancy %
        $totalCapacityQuery = \App\Models\Warehouse::query();
        if ($warehouseId) {
            $totalCapacityQuery->where('id', $warehouseId);
        }
        $totalCapacity = $totalCapacityQuery->sum('capacite_m3') ?: 1000;
        
        $usedVolume = $articles->sum(function($article) {
            return ($article->volume ?? 0.1) * $article->quantite_stock;
        });
        $occupancyRate = round(($usedVolume / $totalCapacity) * 100, 1);

        return response()->json([
            'total_articles' => $totalArticles,
            'valeur_biens' => $valeurBiens,
            'valeur_stock' => $valeurStock,
            'articles_rupture' => $articlesRupture,
            'occupancy_rate' => $occupancyRate,
        ]);
    }

    public function getChartData(Request $request)
    {
        $warehouseId = $request->query('warehouse_id');
        $type = $request->query('type');

        $articleQuery = \App\Models\Article::query();
        if ($warehouseId) {
            $articleQuery->where('warehouse_id', $warehouseId);
        }
        if ($type === 'assets') {
            $articleQuery->whereHas('category', function($q) {
                $q->where('type', 'patrimoine');
            });
        } elseif ($type === 'stocks') {
            $articleQuery->whereHas('category', function($q) {
                $q->where('type', 'stock');
            });
        }

        // Inventaire par domaine
        $inventoryByDomain = (clone $articleQuery)
            ->selectRaw('domaine_utilisation, count(*) as count')
            ->whereNotNull('domaine_utilisation')
            ->groupBy('domaine_utilisation')
            ->get()
            ->pluck('count', 'domaine_utilisation');

        // Occupation par entrepot
        $warehousesQuery = \App\Models\Warehouse::with(['articles' => function($q) use ($type) {
            if ($type === 'assets') {
                $q->whereHas('category', function($sq) { $sq->where('type', 'patrimoine'); });
            } elseif ($type === 'stocks') {
                $q->whereHas('category', function($sq) { $sq->where('type', 'stock'); });
            }
        }]);

        if ($warehouseId) {
            $warehousesQuery->where('id', $warehouseId);
        }
        
        $warehouses = $warehousesQuery->get();
        $occupancyByWarehouse = $warehouses->map(function($w) {
            $capacity = $w->capacite_m3 ?: 100;
            $used = $w->articles->sum(function($a) {
                return ($a->volume ?? 0.05) * $a->quantite_stock;
            });
            return [
                'name' => $w->nom,
                'percent' => round(($used / $capacity) * 100, 1)
            ];
        });

        // Recent Movements
        $movementQuery = \App\Models\StockMovement::with('article', 'user')
            ->whereHas('article', function($q) use ($warehouseId, $type) {
                if ($warehouseId) $q->where('warehouse_id', $warehouseId);
                if ($type === 'assets') {
                    $q->whereHas('category', function($sq) { $sq->where('type', 'patrimoine'); });
                } elseif ($type === 'stocks') {
                    $q->whereHas('category', function($sq) { $sq->where('type', 'stock'); });
                }
            });

        $recentMovements = $movementQuery->latest()->take(5)->get();

        // Trends: Stock In vs Out for last 6 months
        $months = collect(range(5, 0))->map(function($i) {
            return now()->subMonths($i)->format('Y-m');
        });

        $movementsTrend = $months->map(function($month) use ($warehouseId, $type) {
            $baseQuery = \App\Models\StockMovement::where('created_at', 'like', "$month%")
                ->whereHas('article', function($q) use ($warehouseId, $type) {
                    if ($warehouseId) $q->where('warehouse_id', $warehouseId);
                    if ($type === 'assets') {
                        $q->whereHas('category', function($sq) { $sq->where('type', 'patrimoine'); });
                    } elseif ($type === 'stocks') {
                        $q->whereHas('category', function($sq) { $sq->where('type', 'stock'); });
                    }
                });

            return [
                'month' => now()->parse($month . '-01')->format('M'),
                'entrees' => (clone $baseQuery)->where('type', 'entree')->sum('quantite'),
                'sorties' => (clone $baseQuery)->where('type', 'sortie')->sum('quantite')
            ];
        });

        return response()->json([
            'inventory_by_domain' => [
                'labels' => $inventoryByDomain->keys(),
                'data' => $inventoryByDomain->values(),
            ],
            'occupancy_by_warehouse' => [
                'labels' => $occupancyByWarehouse->pluck('name'),
                'data' => $occupancyByWarehouse->pluck('percent'),
            ],
            'movements_trend' => [
                'labels' => $movementsTrend->pluck('month'),
                'in' => $movementsTrend->pluck('entrees'),
                'out' => $movementsTrend->pluck('sorties'),
            ],
            'recent_movements' => $recentMovements
        ]);
    }

    public function getReportingData()
    {
        // Articles les plus consommés (Top 5 Sorties)
        $topArticles = \App\Models\Article::orderBy('quantite_utilisee', 'desc')
            ->take(5)
            ->get(['article', 'reference', 'quantite_utilisee', 'quantite_stock']);

        // Articles dormants (Aucun mouvement depuis 30 jours)
        $dormantArticles = \App\Models\Article::whereDoesntHave('stockMovements', function($q) {
            $q->where('created_at', '>=', now()->subDays(30));
        })->take(5)->get(['article', 'reference', 'quantite_stock', 'updated_at']);

        return response()->json([
            'top_consumed' => $topArticles,
            'dormant_articles' => $dormantArticles,
        ]);
    }
}

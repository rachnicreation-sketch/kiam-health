<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\StockMovement;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StockKpiController extends Controller
{
    /**
     * Return stock KPI summary.
     */
    public function kpis(Request $request)
    {
        $warehouseId = $request->query('warehouse_id');

        $query = Article::withTrashed(false);
        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $articles = $query->get();

        $totalArticles = $articles->count();
        $totalValue    = $articles->sum(fn($a) => $a->quantite_stock * $a->prix_achat);
        $outOfStock    = $articles->filter(fn($a) => $a->quantite_stock <= 0)->count();
        $lowStock      = $articles->filter(fn($a) => $a->quantite_stock > 0 && $a->quantite_stock <= $a->stock_minimum)->count();

        // Taux de rupture
        $tauxRupture = $totalArticles > 0 ? round(($outOfStock / $totalArticles) * 100, 1) : 0;

        // Precision d'inventaire: ratio of validated inventories
        $totalInventories    = Inventory::count();
        $closedInventories   = Inventory::where('statut', 'cloture')->count();
        $inventoryPrecision  = $totalInventories > 0 ? round(($closedInventories / $totalInventories) * 100, 1) : 100;

        // Taux de rotation: movements last 30 days / average stock
        $avgStock = $articles->avg('quantite_stock') ?: 1;
        $movements30 = StockMovement::where('type', 'sortie')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->sum('quantite');
        $tauxRotation = round($movements30 / $avgStock, 2);

        return response()->json([
            'total_articles'     => $totalArticles,
            'total_value'        => round($totalValue),
            'out_of_stock'       => $outOfStock,
            'low_stock'          => $lowStock,
            'taux_rupture'       => $tauxRupture,
            'taux_rotation'      => $tauxRotation,
            'inventory_precision'=> $inventoryPrecision,
            'to_reorder'         => $lowStock + $outOfStock,
        ]);
    }

    /**
     * Return chart data for stock overview.
     */
    public function chartData(Request $request)
    {
        // Evolution stock last 30 days (daily movement totals)
        $days    = 30;
        $labels  = [];
        $entries = [];
        $exits   = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date     = Carbon::now()->subDays($i)->format('Y-m-d');
            $labels[] = Carbon::now()->subDays($i)->format('d/m');

            $dayEntree = StockMovement::where('type', 'entree')
                ->whereDate('created_at', $date)
                ->sum('quantite');
            $daySortie = StockMovement::where('type', 'sortie')
                ->whereDate('created_at', $date)
                ->sum('quantite');

            $entries[] = (int)$dayEntree;
            $exits[]   = (int)$daySortie;
        }

        // Top 10 articles by movement (last 30 days)
        $top = StockMovement::select('article_id', DB::raw('SUM(quantite) as total_moves'))
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('article_id')
            ->orderByDesc('total_moves')
            ->limit(10)
            ->with('article:id,article,reference')
            ->get()
            ->map(fn($m) => [
                'label' => $m->article?->article ?? 'Inconnu',
                'value' => (int)$m->total_moves,
            ]);

        // Overstock: articles where stock > 3x minimum and minimum > 0
        $overstock = Article::where('stock_minimum', '>', 0)
            ->whereRaw('quantite_stock > (stock_minimum * 3)')
            ->count();

        return response()->json([
            'movement_chart' => [
                'labels'  => $labels,
                'entries' => $entries,
                'exits'   => $exits,
            ],
            'top_articles' => $top,
            'overstock'    => $overstock,
        ]);
    }
}

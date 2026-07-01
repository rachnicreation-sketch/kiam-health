<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\StockMovement;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function exportPatrimoinePDF(Request $request)
    {
        $articles = Article::with(['supplier', 'warehouse', 'category'])->get();
        $generator = new \Picqer\Barcode\BarcodeGeneratorHTML();
        
        $pdf = Pdf::loadView('reports.patrimoine', compact('articles', 'generator'));
        $pdf->setPaper('a4', 'landscape');
        
        return $pdf->download('kiam_patrimoine_' . date('Y-m-d') . '.pdf');
    }

    public function exportMouvementsPDF(Request $request)
    {
        $query = StockMovement::with(['article', 'user']);

        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $movements = $query->latest()->get();
        
        $start_date = $request->start_date;
        $end_date = $request->end_date;

        $pdf = Pdf::loadView('reports.mouvements', compact('movements', 'start_date', 'end_date'));
        
        return $pdf->download('kiam_mouvements_' . date('Y-m-d') . '.pdf');
    }

    public function exportInventoryPDF($id)
    {
        $session = Inventory::with(['warehouse', 'user', 'lines.article'])->findOrFail($id);
        
        // Calculate some stats for the report
        $totalLines = $session->lines->count();
        $counted = $session->lines->filter(function($l) {
            return $l->qte_reelle > 0 || $l->ecart != -$l->qte_theorique;
        })->count();
        
        $progression = $totalLines > 0 ? round(($counted / $totalLines) * 100) : 0;
        $discrepancies = $session->lines->filter(fn($l) => $l->ecart != 0)->count();
        $totalAdjustmentValue = $session->lines->reduce(fn($acc, $l) => $acc + ($l->ecart * ($l->article?->prix_achat ?? 0)), 0);

        $pdf = Pdf::loadView('reports.inventory', [
            'session' => $session,
            'progression' => $progression,
            'discrepancies' => $discrepancies,
            'totalAdjustmentValue' => $totalAdjustmentValue
        ]);
        
        return $pdf->download('kiam_inventaire_session_' . $id . '.pdf');
    }
}

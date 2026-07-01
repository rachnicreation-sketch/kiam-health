<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'user', 'warehouse']);

        // Filtering
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('supplier_id') && $request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->has('warehouse_id') && $request->warehouse_id) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Search by reference or supplier name
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('nom', 'like', "%{$search}%");
                  });
            });
        }

        return $query->latest()->paginate(15);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'expected_arrival_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.article_id' => 'required|exists:articles,id',
            'items.*.quantity' => 'required|numeric|min:0.1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $purchaseOrder = PurchaseOrder::create([
                'supplier_id' => $validated['supplier_id'],
                'warehouse_id' => $validated['warehouse_id'] ?? null,
                'user_id' => $request->user()->id,
                'expected_arrival_date' => $validated['expected_arrival_date'] ? \Illuminate\Support\Carbon::parse($validated['expected_arrival_date']) : null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'brouillon',
                'total_amount' => 0,
            ]);

            $totalAmount = 0;
            foreach ($validated['items'] as $itemData) {
                $itemTotal = $itemData['quantity'] * $itemData['unit_price'];
                $totalAmount += $itemTotal;

                $purchaseOrder->items()->create([
                    'article_id' => $itemData['article_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $itemTotal,
                ]);
            }

            $purchaseOrder->update(['total_amount' => $totalAmount]);

            return response()->json($purchaseOrder->load(['items.article', 'supplier', 'warehouse']), 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $purchaseOrder = PurchaseOrder::with(['supplier', 'user', 'warehouse', 'items.article'])->findOrFail($id);
        return response()->json($purchaseOrder);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        
        if ($purchaseOrder->status !== 'brouillon') {
            return response()->json(['message' => 'Seuls les brouillons peuvent être modifiés.'], 422);
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'expected_arrival_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'carrier' => 'nullable|string',
            'tracking_number' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.article_id' => 'required|exists:articles,id',
            'items.*.quantity' => 'required|numeric|min:0.1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($purchaseOrder, $validated) {
            $purchaseOrder->update([
                'supplier_id' => $validated['supplier_id'],
                'warehouse_id' => $validated['warehouse_id'] ?? $purchaseOrder->warehouse_id,
                'expected_arrival_date' => $validated['expected_arrival_date'] ? \Illuminate\Support\Carbon::parse($validated['expected_arrival_date']) : $purchaseOrder->expected_arrival_date,
                'notes' => $validated['notes'] ?? $purchaseOrder->notes,
                'carrier' => $validated['carrier'] ?? $purchaseOrder->carrier,
                'tracking_number' => $validated['tracking_number'] ?? $purchaseOrder->tracking_number,
            ]);

            $purchaseOrder->items()->delete();

            $totalAmount = 0;
            foreach ($validated['items'] as $itemData) {
                $itemTotal = $itemData['quantity'] * $itemData['unit_price'];
                $totalAmount += $itemTotal;

                $purchaseOrder->items()->create([
                    'article_id' => $itemData['article_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $itemTotal,
                ]);
            }

            $purchaseOrder->update(['total_amount' => $totalAmount]);

            return response()->json($purchaseOrder->load(['items.article', 'supplier', 'warehouse']));
        });
    }

    /**
     * Update the status of the purchase order.
     */
    public function updateStatus(Request $request, $id)
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        $newStatus = $request->input('status');

        if (!in_array($newStatus, ['brouillon', 'valide', 'en_cours', 'recu_partiel', 'recu', 'annule'])) {
            return response()->json(['message' => 'Statut invalide'], 422);
        }

        $purchaseOrder->update(['status' => $newStatus]);
        return response()->json($purchaseOrder);
    }

    /**
     * Record a receipt (partial or total)
     */
    public function receive(Request $request, $id)
    {
        $purchaseOrder = PurchaseOrder::with('items.article')->findOrFail($id);
        
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:purchase_order_items,id',
            'items.*.received_quantity' => 'required|numeric|min:0',
            'items.*.batch_number' => 'nullable|string',
            'items.*.expiry_date' => 'nullable|date',
            'items.*.serial_number' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($purchaseOrder, $validated, $request) {
            foreach ($validated['items'] as $receiptData) {
                $item = PurchaseOrderItem::findOrFail($receiptData['id']);
                
                $receivedNow = $receiptData['received_quantity'];
                if ($receivedNow <= 0) continue;

                $item->received_quantity += $receivedNow;
                $item->batch_number = $receiptData['batch_number'] ?? $item->batch_number;
                $item->expiry_date = $receiptData['expiry_date'] ?? $item->expiry_date;
                $item->serial_number = $receiptData['serial_number'] ?? $item->serial_number;
                $item->save();

                // Create Stock Movement
                $article = $item->article;
                StockMovement::create([
                    'article_id' => $article->id,
                    'user_id' => $request->user()->id,
                    'type' => 'entree',
                    'quantite' => $receivedNow,
                    'quantite_avant' => $article->quantite_stock,
                    'quantite_apres' => $article->quantite_stock + $receivedNow,
                    'date_mouvement' => now(),
                    'reference_doc' => $purchaseOrder->reference,
                    'notes' => "Réception BC {$purchaseOrder->reference}. Lot: {$item->batch_number}",
                    'warehouse_to' => $purchaseOrder->warehouse_id ?? $article->warehouse_id,
                ]);
            }

            // Update PO status based on received quantities
            $allReceived = true;
            $anyReceived = false;
            foreach ($purchaseOrder->items as $item) {
                if ($item->received_quantity < $item->quantity) {
                    $allReceived = false;
                }
                if ($item->received_quantity > 0) {
                    $anyReceived = true;
                }
            }

            if ($allReceived) {
                $purchaseOrder->status = 'recu';
            } elseif ($anyReceived) {
                $purchaseOrder->status = 'recu_partiel';
            }
            
            $purchaseOrder->save();

            return response()->json($purchaseOrder->load('items.article'));
        });
    }

    /**
     * Export the purchase order to PDF.
     */
    public function exportPDF($id)
    {
        $purchaseOrder = PurchaseOrder::with(['supplier', 'user', 'warehouse', 'items.article'])->findOrFail($id);
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.purchase-order', compact('purchaseOrder'));
        
        return $pdf->download("BC_{$purchaseOrder->reference}.pdf");
    }

    /**
     * Get the history of the purchase order.
     */
    public function getHistory($id)
    {
        $logs = \App\Models\AuditLog::with('user')
            ->where('model', PurchaseOrder::class)
            ->where('model_id', $id)
            ->latest()
            ->get();
            
        return response()->json($logs);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        
        if (!in_array($purchaseOrder->status, ['brouillon', 'annule'])) {
            return response()->json(['message' => 'Seuls les brouillons ou commandes annulées peuvent être supprimés.'], 422);
        }

        $purchaseOrder->items()->delete();
        $purchaseOrder->delete();

        return response()->json(['message' => 'Commande supprimée avec succès.']);
    }
}

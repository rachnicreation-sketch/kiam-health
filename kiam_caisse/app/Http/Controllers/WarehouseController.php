<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWarehouseRequest;
use App\Http\Requests\UpdateWarehouseRequest;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Emplacement;

class WarehouseController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $query = Warehouse::query()->withCount('articles');

        if ($request->has('include') && $request->include === 'full_hierarchy') {
            $query->with(['zones.allees.rayonnages.emplacements']);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function (\Illuminate\Database\Eloquent\Builder $q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%");
            });
        }

        return $query->paginate(100); // Higher limit for hierarchy view
    }

    public function store(StoreWarehouseRequest $request)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Action réservée aux administrateurs.'], 403);
        }
        $warehouse = Warehouse::create($request->validated());
        return response()->json($warehouse, 201);
    }

    public function show(Warehouse $warehouse)
    {
        return $warehouse->load(['zones.allees.rayonnages.emplacements', 'articles' => function($q) {
            $q->latest()->take(5);
        }]);
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Action réservée aux administrateurs.'], 403);
        }
        $warehouse->update($request->validated());
        return response()->json($warehouse);
    }

    public function destroy(Request $request, Warehouse $warehouse)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Action réservée aux administrateurs.'], 403);
        }
        if ($warehouse->articles()->exists()) {
            return response()->json(['message' => 'Impossible de supprimer cet entrepôt car il contient des articles.'], 403);
        }
        $warehouse->delete();
        return response()->json(null, 204);
    }

    public function allEmplacements(Warehouse $warehouse)
    {
        $emplacements = Emplacement::whereHas('rayonnage.allee.zone', function($q) use ($warehouse) {
            $q->where('warehouse_id', $warehouse->id);
        })->get();
        
        return response()->json($emplacements);
    }
}

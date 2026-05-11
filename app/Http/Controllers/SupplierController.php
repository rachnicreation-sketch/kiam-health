<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function (\Illuminate\Database\Eloquent\Builder $q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('contact_nom', 'like', "%{$search}%");
            });
        }

        return $query->paginate(15);
    }

    public function store(StoreSupplierRequest $request)
    {
        $supplier = Supplier::create($request->validated());
        return response()->json($supplier, 201);
    }

    public function show(Supplier $supplier)
    {
        return $supplier->load(['articles' => function($q) {
            $q->latest()->take(5);
        }]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        $supplier->update($request->validated());
        return response()->json($supplier);
    }

    public function destroy(Supplier $supplier)
    {
        if ($supplier->articles()->exists()) {
            return response()->json(['message' => 'Impossible de supprimer ce fournisseur car il est lié à des articles.'], 403);
        }
        $supplier->delete();
        return response()->json(null, 204);
    }
}

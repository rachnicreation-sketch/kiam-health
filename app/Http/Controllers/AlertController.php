<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Http\Requests\StoreAlertRequest;
use App\Http\Requests\UpdateAlertRequest;

class AlertController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $query = Alert::query()->with('article');

        if ($request->has('statut')) {
            $isRead = $request->statut === 'lu' || $request->statut === '1';
            $query->where('lu', $isRead);
        }

        return $query->latest()->paginate(15);
    }

    public function store(StoreAlertRequest $request)
    {
        $alert = Alert::create($request->validated());
        return response()->json($alert, 201);
    }

    public function show(Alert $alert)
    {
        return $alert->load('article');
    }

    public function update(UpdateAlertRequest $request, Alert $alert)
    {
        $alert->update($request->validated());
        return response()->json($alert);
    }

    public function destroy(Alert $alert)
    {
        $alert->delete();
        return response()->json(null, 204);
    }
    public function unreadCount()
    {
        return response()->json(['count' => Alert::where('lu', false)->count()]);
    }

    public function markAllAsRead()
    {
        Alert::where('lu', false)->update(['lu' => true, 'lu_at' => now()]);
        return response()->json(['message' => 'Toutes les alertes sont marquées comme lues.']);
    }
}

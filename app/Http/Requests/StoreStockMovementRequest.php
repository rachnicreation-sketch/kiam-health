<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockMovementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'article_id' => 'required|exists:articles,id',
            'type' => 'required|in:entree,sortie,transfert,ajustement',
            'motif' => 'required|string|max:191',
            'quantite' => 'required|integer|min:1',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'reference_doc' => 'nullable|string|max:191',
            'destination' => 'nullable|string|max:191',
            'warehouse_from' => 'nullable|exists:warehouses,id',
            'warehouse_to' => 'nullable|exists:warehouses,id',
            'notes' => 'nullable|string',
            'date_mouvement' => 'nullable|date',
        ];
    }
}

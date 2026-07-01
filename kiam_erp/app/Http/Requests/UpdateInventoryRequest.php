<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryRequest extends FormRequest
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
            'type' => 'sometimes|required|in:partiel,complet',
            'statut' => 'sometimes|required|in:en_cours,valide,annule',
            'date_inventaire' => 'sometimes|required|date',
            'warehouse_id' => 'sometimes|required|exists:warehouses,id',
            'notes' => 'nullable|string',
        ];
    }
}

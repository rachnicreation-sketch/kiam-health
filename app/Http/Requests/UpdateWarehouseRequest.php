<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWarehouseRequest extends FormRequest
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
            'nom' => 'sometimes|required|string|max:191',
            'code' => 'sometimes|required|string|max:191|unique:warehouses,code,' . $this->route('warehouse')->id,
            'type' => 'sometimes|required|in:entrepot,magasin',
            'adresse' => 'nullable|string|max:191',
            'capacite_totale' => 'nullable|integer|min:0',
            'responsable' => 'nullable|string|max:191',
            'actif' => 'boolean',
        ];
    }
}

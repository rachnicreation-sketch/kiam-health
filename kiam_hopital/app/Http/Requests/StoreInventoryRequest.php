<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryRequest extends FormRequest
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
            'warehouse_id' => 'required|exists:warehouses,id',
            'reference' => 'required|string|unique:inventories,reference',
            'type' => 'nullable|in:annuel,tournant,par_zone,par_magasin',
            'notes' => 'nullable|string',
        ];
    }
}

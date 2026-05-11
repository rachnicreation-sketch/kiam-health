<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierRequest extends FormRequest
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
            'code' => 'nullable|string|max:191|unique:suppliers,code,' . $this->route('supplier')->id,
            'adresse' => 'nullable|string|max:191',
            'ville' => 'nullable|string|max:191',
            'pays' => 'nullable|string|max:191',
            'telephone' => 'nullable|string|max:191',
            'email' => 'nullable|email|max:191',
            'contact_nom' => 'nullable|string|max:191',
            'notes' => 'nullable|string',
            'actif' => 'boolean',
        ];
    }
}

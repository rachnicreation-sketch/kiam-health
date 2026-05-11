<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateArticleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'article' => 'sometimes|required|string|max:191',
            'reference' => 'sometimes|required|string|max:191|unique:articles,reference,' . $this->route('article')->id,
            'code_barre' => 'nullable|string|max:191|unique:articles,code_barre,' . $this->route('article')->id,
            'marque' => 'nullable|string|max:191',
            'fabricant' => 'nullable|string|max:191',
            'categorie' => 'nullable|string|max:100',
            'domaine_utilisation' => 'nullable|string|max:100',
            'date_acquisition' => 'nullable|date',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'numero_facture' => 'nullable|string|max:191',
            'prix_achat' => 'nullable|numeric|min:0',
            'quantite_acquise' => 'sometimes|required|integer|min:0',
            'quantite_utilisee' => 'nullable|integer|min:0',
            'quantite_reservee' => 'nullable|integer|min:0',
            'stock_minimum' => 'nullable|integer|min:0',
            'localisation' => 'nullable|string|max:191',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'emplacement_id' => 'nullable|exists:emplacements,id',
            'statut' => 'nullable|in:actif,inactif,obsolete,rebut',
            'observation' => 'nullable|string',
        ];
    }
}

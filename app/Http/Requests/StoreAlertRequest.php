<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAlertRequest extends FormRequest
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
            'type' => 'required|in:stock_rupture,stock_bas,peremption',
            'message' => 'required|string',
            'statut' => 'nullable|in:non_lu,lu,traite',
        ];
    }
}

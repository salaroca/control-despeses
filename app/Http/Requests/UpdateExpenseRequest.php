<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'subcategory_id' => ['required', 'integer', 'exists:subcategories,id'],
            'bank_id' => ['nullable', 'integer', 'exists:banks,id'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'date' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}

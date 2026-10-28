<?php

namespace App\Http\Requests;

use App\Models\Price;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePriceRequest extends FormRequest
{
    private const UNIT_NAMES = ['kg' => 'pes (g o kg)', 'l' => 'volum (ml o l)', 'u' => 'unitats (u)'];

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
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'shop_id' => ['required', 'integer', 'exists:shops,id'],
            'brand' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0.01', 'max:99999'],
            'pack_count' => ['required', 'integer', 'min:1', 'max:999'],
            'size' => ['required', 'numeric', 'gt:0', 'max:99999'],
            'size_unit' => ['required', Rule::in(array_keys(Price::SIZE_UNITS))],
            'date' => ['required', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'product_id.required' => 'Tria un article de la llista.',
            'product_id.exists' => 'Tria un article de la llista.',
            'shop_id.required' => 'Tria una botiga.',
            'shop_id.exists' => 'Tria una botiga.',
            'price.required' => 'Escriu el preu.',
            'price.numeric' => 'El preu ha de ser un número.',
            'price.min' => 'El preu ha de ser més gran que 0.',
            'pack_count.*' => 'Les unitats han de ser un número enter entre 1 i 999.',
            'size.required' => 'Escriu la mida (p. ex. 1,5).',
            'size.numeric' => 'La mida ha de ser un número.',
            'size.gt' => 'La mida ha de ser més gran que 0.',
            'size_unit.*' => 'Tria la unitat (g, kg, ml, l o u).',
            'date.*' => 'Escriu una data vàlida.',
        ];
    }

    /**
     * Once a product compares by kg, l or u, its prices must use a compatible unit; otherwise
     * the price per unit could not be compared (e.g. water in grams).
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->hasAny(['product_id', 'size_unit'])) {
                    return;
                }

                $productUnit = Product::find($this->input('product_id'))?->unit;

                if ($productUnit !== null && Price::baseUnitFor($this->input('size_unit')) !== $productUnit) {
                    $validator->errors()->add(
                        'size_unit',
                        'Aquest article es compara per '.self::UNIT_NAMES[$productUnit].'.',
                    );
                }
            },
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_id', 'shop_id', 'brand', 'price', 'pack_count', 'size', 'size_unit', 'date'])]
class Price extends Model
{
    /**
     * Each unit a size can be typed in, with the product unit it compares by and the factor to
     * convert to it (500 g = 0.5 kg, 330 ml = 0.33 l).
     */
    public const SIZE_UNITS = [
        'g' => ['unit' => 'kg', 'factor' => 0.001],
        'kg' => ['unit' => 'kg', 'factor' => 1],
        'ml' => ['unit' => 'l', 'factor' => 0.001],
        'l' => ['unit' => 'l', 'factor' => 1],
        'u' => ['unit' => 'u', 'factor' => 1],
    ];

    /**
     * @var list<string>
     */
    protected $appends = ['base_unit', 'base_quantity', 'unit_price'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'pack_count' => 'integer',
            'size' => 'decimal:3',
            'date' => 'date:Y-m-d',
        ];
    }

    /**
     * Product unit a size unit compares by (kg, l or u).
     */
    public static function baseUnitFor(string $sizeUnit): string
    {
        return self::SIZE_UNITS[$sizeUnit]['unit'];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<Shop, $this>
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * kg, l or u: what this price compares by.
     */
    protected function baseUnit(): Attribute
    {
        return Attribute::get(fn () => self::baseUnitFor($this->size_unit));
    }

    /**
     * Total quantity in the base unit: 6 × 1.5 l = 9 (l), 4 × 125 g = 0.5 (kg).
     */
    protected function baseQuantity(): Attribute
    {
        return Attribute::get(fn () => round(
            $this->pack_count * (float) $this->size * self::SIZE_UNITS[$this->size_unit]['factor'],
            6,
        ));
    }

    /**
     * Price per kg, l or unit, the figure prices are compared by.
     */
    protected function unitPrice(): Attribute
    {
        return Attribute::get(fn () => $this->base_quantity > 0
            ? round((float) $this->price / $this->base_quantity, 4)
            : null);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'group', 'unit'])]
class Product extends Model
{
    /**
     * Units a product's price can be compared by: per kilo, per litre or per unit.
     */
    public const UNITS = ['kg', 'l', 'u'];

    /**
     * @return HasMany<Price, $this>
     */
    public function prices(): HasMany
    {
        return $this->hasMany(Price::class);
    }

    /**
     * A product without unit takes it from its first price (g/kg → kg, ml/l → l, u → u), so
     * the user never has to set it by hand.
     */
    public function adoptUnitFrom(string $sizeUnit): void
    {
        if ($this->unit === null) {
            $this->update(['unit' => Price::baseUnitFor($sizeUnit)]);
        }
    }
}

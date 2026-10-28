<?php

use App\Models\Price;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
    $this->water = Product::create(['name' => 'Aigua', 'group' => 'Beguda', 'unit' => 'l']);
    $this->mercadona = Shop::create(['name' => 'Mercadona']);
    $this->bonPreu = Shop::create(['name' => 'Bon Preu']);
});

function addPrice(array $data): Price
{
    return Price::create(array_merge([
        'product_id' => test()->water->id,
        'shop_id' => test()->mercadona->id,
        'brand' => null,
        'price' => 1,
        'pack_count' => 1,
        'size' => 1,
        'size_unit' => 'l',
        'date' => '2026-10-21',
    ], $data));
}

test('it lists each option of a product cheapest per unit first, with the difference against the cheapest', function () {
    addPrice(['shop_id' => $this->bonPreu->id, 'brand' => 'Font Vella', 'price' => 2.85, 'pack_count' => 6, 'size' => 1.5]);
    addPrice(['brand' => 'Hacendado', 'price' => 1.20, 'pack_count' => 6, 'size' => 1.5]);

    $this->get('/preus/comparativa')->assertInertia(fn ($page) => $page
        ->component('Preus/Comparativa')
        ->has('comparisonList', 1)
        ->where('comparisonList.0.name', 'Aigua')
        ->where('comparisonList.0.group', 'Beguda')
        ->where('comparisonList.0.unit', 'l')
        ->where('comparisonList.0.options.0.shop', 'Mercadona')
        ->where('comparisonList.0.options.0.brand', 'Hacendado')
        ->where('comparisonList.0.options.0.unit_price', 0.1333)
        ->where('comparisonList.0.options.0.is_cheapest', true)
        ->where('comparisonList.0.options.0.difference', 0)
        ->where('comparisonList.0.options.1.shop', 'Bon Preu')
        ->where('comparisonList.0.options.1.is_cheapest', false)
        ->where('comparisonList.0.options.1.difference', 1.375)
    );
});

test('only the latest price of each shop and brand counts', function () {
    addPrice(['brand' => 'Hacendado', 'price' => 0.50, 'date' => '2026-09-01']);
    addPrice(['brand' => 'hacendado ', 'price' => 0.70, 'date' => '2026-10-15']);
    // Another brand in the same shop is a separate option.
    addPrice(['brand' => 'Bezoya', 'price' => 0.90, 'date' => '2026-08-01']);

    $this->get('/preus/comparativa')->assertInertia(fn ($page) => $page
        ->has('comparisonList.0.options', 2)
        ->where('comparisonList.0.options.0.price', '0.70')
        ->where('comparisonList.0.options.0.date', '2026-10-15')
        ->where('comparisonList.0.options.1.brand', 'Bezoya')
    );
});

test('several options with the same price per unit are all marked as cheapest', function () {
    addPrice(['price' => 1]);
    addPrice(['shop_id' => $this->bonPreu->id, 'price' => 2, 'size' => 2]);

    $this->get('/preus/comparativa')->assertInertia(fn ($page) => $page
        ->where('comparisonList.0.options.0.is_cheapest', true)
        ->where('comparisonList.0.options.1.is_cheapest', true)
    );
});

test('products without prices are not listed, and products are sorted by name ignoring accents', function () {
    Product::create(['name' => 'Ous', 'unit' => 'u']);
    $rice = Product::create(['name' => 'Arròs', 'unit' => 'kg']);
    addPrice([]);
    addPrice(['product_id' => $rice->id, 'size_unit' => 'kg']);

    $this->get('/preus/comparativa')->assertInertia(fn ($page) => $page
        ->has('comparisonList', 2)
        ->where('comparisonList.0.name', 'Aigua')
        ->where('comparisonList.1.name', 'Arròs')
    );
});

test('prices in a unit other than the product current unit are left out', function () {
    addPrice(['price' => 1]);
    addPrice(['shop_id' => $this->bonPreu->id, 'size_unit' => 'kg', 'price' => 0.10]);

    $this->get('/preus/comparativa')->assertInertia(fn ($page) => $page
        ->has('comparisonList.0.options', 1)
        ->where('comparisonList.0.options.0.shop', 'Mercadona')
    );
});

test('the comparison page requires login', function () {
    auth()->logout();

    $this->get('/preus/comparativa')->assertRedirect('/login');
});

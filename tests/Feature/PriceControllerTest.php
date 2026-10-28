<?php

use App\Models\Price;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
    $this->water = Product::create(['name' => 'Aigua']);
    $this->shop = Shop::create(['name' => 'Mercadona']);
});

function priceData(array $overrides = []): array
{
    return array_merge([
        'product_id' => test()->water->id,
        'shop_id' => test()->shop->id,
        'brand' => 'Hacendado',
        'price' => 1.20,
        'pack_count' => 6,
        'size' => 1.5,
        'size_unit' => 'l',
        'date' => '2026-10-21',
    ], $overrides);
}

test('a price can be saved with its pack and size', function () {
    $this->post('/preus', priceData())->assertRedirect()->assertSessionHasNoErrors();

    $price = Price::first();
    expect($price->brand)->toBe('Hacendado')
        ->and($price->price)->toBe('1.20')
        ->and($price->pack_count)->toBe(6)
        ->and($price->size_unit)->toBe('l')
        ->and($price->date->format('Y-m-d'))->toBe('2026-10-21');
});

test('a price works out its total quantity and price per kg, l or unit', function () {
    $water = Price::create(priceData());
    $yogurt = Price::create(priceData(['price' => 2, 'pack_count' => 4, 'size' => 125, 'size_unit' => 'g']));
    $eggs = Price::create(priceData(['price' => 3.24, 'pack_count' => 1, 'size' => 12, 'size_unit' => 'u']));

    expect($water->base_unit)->toBe('l')
        ->and($water->base_quantity)->toEqual(9)
        ->and($water->unit_price)->toEqual(0.1333);
    expect($yogurt->base_unit)->toBe('kg')
        ->and($yogurt->base_quantity)->toEqual(0.5)
        ->and($yogurt->unit_price)->toEqual(4);
    expect($eggs->unit_price)->toEqual(0.27);
});

test('a product without unit takes it from its first price', function () {
    $this->post('/preus', priceData(['size_unit' => 'ml', 'size' => 330]));

    expect($this->water->refresh()->unit)->toBe('l');
});

test('a product that already has a unit keeps it', function () {
    $this->water->update(['unit' => 'l']);

    $this->post('/preus', priceData(['size_unit' => 'l']));

    expect($this->water->refresh()->unit)->toBe('l');
});

test('a price with a unit incompatible with the product is rejected', function () {
    $this->water->update(['unit' => 'l']);

    $this->post('/preus', priceData(['size_unit' => 'g', 'size' => 500]))
        ->assertSessionHasErrors(['size_unit' => 'Aquest article es compara per volum (ml o l).']);

    expect(Price::count())->toBe(0);
});

test('required fields and limits are validated with messages in Catalan', function () {
    $this->post('/preus', priceData([
        'product_id' => null,
        'shop_id' => null,
        'price' => 0,
        'pack_count' => 0,
        'size' => 0,
        'size_unit' => 'paquet',
    ]))->assertSessionHasErrors([
        'product_id' => 'Tria un article de la llista.',
        'shop_id' => 'Tria una botiga.',
        'price' => 'El preu ha de ser més gran que 0.',
        'pack_count',
        'size' => 'La mida ha de ser més gran que 0.',
        'size_unit',
    ]);
});

test('the brand is optional', function () {
    $this->post('/preus', priceData(['brand' => null]))->assertSessionHasNoErrors();

    expect(Price::first()->brand)->toBeNull();
});

test('the prices page lists the latest prices first with product, shop and price per unit', function () {
    Price::create(priceData(['date' => '2026-10-01', 'brand' => 'Antic']));
    Price::create(priceData(['date' => '2026-10-21', 'brand' => 'Nou']));

    $this->get('/preus')->assertInertia(fn ($page) => $page
        ->component('Preus/Index')
        ->has('prices.data', 2)
        ->where('prices.data.0.brand', 'Nou')
        ->where('prices.data.0.product.name', 'Aigua')
        ->where('prices.data.0.shop.name', 'Mercadona')
        ->where('prices.data.0.base_unit', 'l')
        ->where('prices.data.0.unit_price', 0.1333)
        ->has('productsList', 1)
        ->has('shopsList', 1)
    );
});

test('the prices page suggests the brands already used for each product', function () {
    $milk = Product::create(['name' => 'Llet']);
    Price::create(priceData(['brand' => 'Hacendado']));
    Price::create(priceData(['brand' => 'Font Vella']));
    Price::create(priceData(['brand' => 'Hacendado']));
    Price::create(priceData(['product_id' => $milk->id, 'brand' => 'Llet Nostra']));
    Price::create(priceData(['brand' => null]));

    $this->get('/preus')->assertInertia(fn ($page) => $page
        ->where("brandsByProduct.{$this->water->id}", ['Font Vella', 'Hacendado'])
        ->where("brandsByProduct.{$milk->id}", ['Llet Nostra'])
    );
});

test('the prices list is paginated by 20', function () {
    foreach (range(1, 21) as $day) {
        Price::create(priceData(['date' => sprintf('2026-09-%02d', $day)]));
    }

    $this->get('/preus')->assertInertia(fn ($page) => $page->has('prices.data', 20));
});

test('a price can be updated and deleted', function () {
    $price = Price::create(priceData());

    $this->put("/preus/{$price->id}", priceData(['price' => 1.35]))->assertRedirect();
    expect($price->refresh()->price)->toBe('1.35');

    $this->delete("/preus/{$price->id}")->assertRedirect();
    expect(Price::count())->toBe(0);
});

test('deleting a product or a shop deletes its prices', function () {
    $other = Shop::create(['name' => 'Bon Preu']);
    Price::create(priceData());
    Price::create(priceData(['shop_id' => $other->id]));

    $this->delete("/botigues/{$other->id}");
    expect(Price::count())->toBe(1);

    $this->delete("/articles/{$this->water->id}");
    expect(Price::count())->toBe(0);
});

test('the products and shops lists say how many prices each one has', function () {
    Price::create(priceData());
    Price::create(priceData());

    $this->get('/articles')->assertInertia(fn ($page) => $page->where('productsList.0.prices_count', 2));
    $this->get('/botigues')->assertInertia(fn ($page) => $page->where('shopsList.0.prices_count', 2));
});

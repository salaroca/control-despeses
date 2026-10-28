<?php

use App\Models\Product;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('the products page lists the products alphabetically with their group and unit', function () {
    Product::create(['name' => 'Ous', 'group' => 'Làctics i ous', 'unit' => 'u']);
    Product::create(['name' => 'Arròs', 'group' => 'Cereal', 'unit' => 'kg']);

    $this->get('/articles')->assertInertia(fn ($page) => $page
        ->component('Articles/Index')
        ->has('productsList', 2)
        ->where('productsList.0.name', 'Arròs')
        ->where('productsList.0.group', 'Cereal')
        ->where('productsList.0.unit', 'kg')
    );
});

test('a product can be created with only a name', function () {
    $this->post('/articles', ['name' => 'Arròs'])->assertRedirect();

    $product = Product::first();
    expect($product->name)->toBe('Arròs')
        ->and($product->group)->toBeNull()
        ->and($product->unit)->toBeNull();
});

test('a product can be created with group and unit', function () {
    $this->post('/articles', ['name' => 'Llet', 'group' => 'Beguda', 'unit' => 'l'])->assertRedirect();

    expect(Product::first()->only(['group', 'unit']))->toBe(['group' => 'Beguda', 'unit' => 'l']);
});

test('a product name must be unique and the unit must be kg, l or u', function () {
    Product::create(['name' => 'Arròs']);

    $this->post('/articles', ['name' => 'Arròs'])->assertSessionHasErrors('name');
    $this->post('/articles', ['name' => 'Pasta', 'unit' => 'paquet'])->assertSessionHasErrors('unit');

    expect(Product::count())->toBe(1);
});

test('a product can be updated', function () {
    $product = Product::create(['name' => 'Arros']);

    $this->put("/articles/{$product->id}", ['name' => 'Arròs', 'group' => 'Cereal', 'unit' => 'kg'])->assertRedirect();

    expect($product->refresh()->only(['name', 'group', 'unit']))
        ->toBe(['name' => 'Arròs', 'group' => 'Cereal', 'unit' => 'kg']);
});

test('a product can be deleted', function () {
    $product = Product::create(['name' => 'Arròs']);

    $this->delete("/articles/{$product->id}")->assertRedirect();

    expect(Product::count())->toBe(0);
});

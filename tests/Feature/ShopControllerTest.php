<?php

use App\Models\Shop;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('the shops page lists the shops alphabetically', function () {
    Shop::create(['name' => 'Mercadona']);
    Shop::create(['name' => 'Bon Preu']);

    $this->get('/botigues')->assertInertia(fn ($page) => $page
        ->component('Botigues/Index')
        ->has('shopsList', 2)
        ->where('shopsList.0.name', 'Bon Preu')
        ->where('shopsList.1.name', 'Mercadona')
    );
});

test('a shop can be created', function () {
    $this->post('/botigues', ['name' => 'Bon Preu'])->assertRedirect();

    expect(Shop::where('name', 'Bon Preu')->exists())->toBeTrue();
});

test('a shop name is required and must be unique', function () {
    Shop::create(['name' => 'Bon Preu']);

    $this->post('/botigues', ['name' => ''])->assertSessionHasErrors('name');
    $this->post('/botigues', ['name' => 'Bon Preu'])->assertSessionHasErrors('name');

    expect(Shop::count())->toBe(1);
});

test('a shop can be renamed, keeping its own name valid', function () {
    $shop = Shop::create(['name' => 'Bon Preu']);

    $this->put("/botigues/{$shop->id}", ['name' => 'Bon Preu'])->assertSessionHasNoErrors();
    $this->put("/botigues/{$shop->id}", ['name' => 'Bonpreu Esclat'])->assertRedirect();

    expect($shop->refresh()->name)->toBe('Bonpreu Esclat');
});

test('a shop can be deleted', function () {
    $shop = Shop::create(['name' => 'Bon Preu']);

    $this->delete("/botigues/{$shop->id}")->assertRedirect();

    expect(Shop::count())->toBe(0);
});

test('the shops page requires login', function () {
    auth()->logout();

    $this->get('/botigues')->assertRedirect('/login');
});

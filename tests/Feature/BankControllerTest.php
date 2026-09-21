<?php

use App\Models\Bank;
use App\Models\Category;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('the banks index page renders with the shared banks list', function () {
    Bank::create(['name' => 'Banc A']);

    $response = $this->get('/bancs');

    $response->assertInertia(fn ($page) => $page
        ->component('Bancs/Index')
        ->has('banksList', 1)
        ->where('banksList.0.name', 'Banc A')
    );
});

test('a bank can be created', function () {
    $response = $this->post('/bancs', ['name' => 'Banc A']);

    $response->assertRedirect();
    expect(Bank::where('name', 'Banc A')->exists())->toBeTrue();
});

test('a bank name must be unique', function () {
    Bank::create(['name' => 'Banc A']);

    $response = $this->post('/bancs', ['name' => 'Banc A']);

    $response->assertSessionHasErrors('name');
    expect(Bank::count())->toBe(1);
});

test('a bank can be updated', function () {
    $bank = Bank::create(['name' => 'Banc A']);

    $response = $this->put("/bancs/{$bank->id}", ['name' => 'Banc B']);

    $response->assertRedirect();
    expect($bank->refresh()->name)->toBe('Banc B');
});

test('deleting a bank removes it but keeps the expenses that used it', function () {
    $bank = Bank::create(['name' => 'Banc A']);
    $category = Category::create(['name' => 'Menjar']);
    $subcategory = $category->subcategories()->create(['name' => 'Supermercats']);
    $expense = $subcategory->expenses()->create(['bank_id' => $bank->id, 'amount' => 10, 'date' => '2026-09-19']);

    $response = $this->delete("/bancs/{$bank->id}");

    $response->assertRedirect();
    expect(Bank::count())->toBe(0);
    expect($expense->refresh()->bank_id)->toBeNull();
});

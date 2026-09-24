<?php

use App\Models\Bank;
use App\Models\Category;
use App\Models\Expense;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

function createSubcategory(string $categoryName = 'Menjar', string $subcategoryName = 'Supermercats')
{
    $category = Category::create(['name' => $categoryName]);

    return $category->subcategories()->create(['name' => $subcategoryName]);
}

test('the expenses index page renders with the expenses list and shared categories', function () {
    $subcategory = createSubcategory();

    $subcategory->expenses()->create([
        'amount' => 12.50,
        'date' => '2026-09-19',
        'note' => 'Fruita i verdura',
    ]);

    $response = $this->get('/despeses');

    $response->assertInertia(fn ($page) => $page
        ->component('Despeses/Index')
        ->has('expenses.data', 1)
        ->where('expenses.data.0.note', 'Fruita i verdura')
        ->has('categoriesList', 1)
        ->where('categoriesList.0.name', 'Menjar')
    );
});

test('the expenses index can be filtered by a search term matching the note', function () {
    $subcategory = createSubcategory();

    $subcategory->expenses()->create(['amount' => 12.50, 'date' => '2026-09-19', 'note' => 'Fruita i verdura']);
    $subcategory->expenses()->create(['amount' => 30, 'date' => '2026-09-19', 'note' => 'Benzina']);

    $response = $this->get('/despeses?search=fruita');

    $response->assertInertia(fn ($page) => $page
        ->has('expenses.data', 1)
        ->where('expenses.data.0.note', 'Fruita i verdura')
        ->where('filters.search', 'fruita')
    );
});

test('the expenses index can be filtered by subcategory', function () {
    $subcategory = createSubcategory();
    $otherSubcategory = createSubcategory('Transport', 'Gasolina');

    $subcategory->expenses()->create(['amount' => 12.50, 'date' => '2026-09-19']);
    $otherSubcategory->expenses()->create(['amount' => 30, 'date' => '2026-09-19']);

    $response = $this->get("/despeses?subcategory_id={$otherSubcategory->id}");

    $response->assertInertia(fn ($page) => $page
        ->has('expenses.data', 1)
        ->where('expenses.data.0.subcategory_id', $otherSubcategory->id)
        ->where('filters.subcategory_id', $otherSubcategory->id)
    );
});

test('the expenses index without filters returns them all and null filters', function () {
    $subcategory = createSubcategory();
    $subcategory->expenses()->create(['amount' => 12.50, 'date' => '2026-09-19']);

    $response = $this->get('/despeses');

    $response->assertInertia(fn ($page) => $page
        ->where('filters.search', null)
        ->where('filters.subcategory_id', null)
    );
});

test('the root url redirects to the expenses page', function () {
    $response = $this->get('/');

    $response->assertRedirect('/despeses');
});

test('an expense can be created with valid data', function () {
    $subcategory = createSubcategory();

    $response = $this->post('/despeses', [
        'subcategory_id' => $subcategory->id,
        'amount' => 45.90,
        'date' => '2026-09-19',
        'note' => 'Compra setmanal',
    ]);

    $response->assertRedirect();
    expect(Expense::count())->toBe(1);
    expect(Expense::first()->note)->toBe('Compra setmanal');
});

test('an expense can be created with a bank', function () {
    $subcategory = createSubcategory();
    $bank = Bank::create(['name' => 'Banc A']);

    $response = $this->post('/despeses', [
        'subcategory_id' => $subcategory->id,
        'bank_id' => $bank->id,
        'amount' => 10,
        'date' => '2026-09-19',
    ]);

    $response->assertRedirect();
    expect(Expense::first()->bank_id)->toBe($bank->id);
});

test('an expense can be created without a bank', function () {
    $subcategory = createSubcategory();

    $response = $this->post('/despeses', [
        'subcategory_id' => $subcategory->id,
        'amount' => 10,
        'date' => '2026-09-19',
    ]);

    $response->assertRedirect();
    expect(Expense::first()->bank_id)->toBeNull();
});

test('creating an expense with a non-existent bank fails validation', function () {
    $subcategory = createSubcategory();

    $response = $this->post('/despeses', [
        'subcategory_id' => $subcategory->id,
        'bank_id' => 999,
        'amount' => 10,
        'date' => '2026-09-19',
    ]);

    $response->assertSessionHasErrors('bank_id');
    expect(Expense::count())->toBe(0);
});

test('an expense can be created without a note', function () {
    $subcategory = createSubcategory();

    $response = $this->post('/despeses', [
        'subcategory_id' => $subcategory->id,
        'amount' => 10,
        'date' => '2026-09-19',
    ]);

    $response->assertRedirect();
    expect(Expense::first()->note)->toBeNull();
});

test('creating an expense requires a valid subcategory, amount and date', function () {
    $response = $this->post('/despeses', [
        'subcategory_id' => 999,
        'amount' => 0,
        'date' => 'not-a-date',
    ]);

    $response->assertSessionHasErrors(['subcategory_id', 'amount', 'date']);
    expect(Expense::count())->toBe(0);
});

test('an expense can be updated', function () {
    $subcategory = createSubcategory();
    $otherSubcategory = createSubcategory('Transport', 'Gasolina');

    $expense = $subcategory->expenses()->create([
        'amount' => 20,
        'date' => '2026-09-19',
    ]);

    $response = $this->put("/despeses/{$expense->id}", [
        'subcategory_id' => $otherSubcategory->id,
        'amount' => 35.25,
        'date' => '2026-09-20',
        'note' => 'Dipòsit',
    ]);

    $response->assertRedirect();
    $expense->refresh();
    expect($expense->subcategory_id)->toBe($otherSubcategory->id)
        ->and((float) $expense->amount)->toBe(35.25)
        ->and($expense->note)->toBe('Dipòsit');
});

test('an expense can be deleted', function () {
    $subcategory = createSubcategory();

    $expense = $subcategory->expenses()->create([
        'amount' => 20,
        'date' => '2026-09-19',
    ]);

    $response = $this->delete("/despeses/{$expense->id}");

    $response->assertRedirect();
    expect(Expense::count())->toBe(0);
});

<?php

use App\Models\Budget;
use App\Models\Category;

function createBudgetSubcategory()
{
    $category = Category::create(['name' => 'Subministres']);

    return $category->subcategories()->create(['name' => 'Electricitat']);
}

test('the budgets index page renders the budgets for the requested year', function () {
    $subcategory = createBudgetSubcategory();
    $subcategory->budgets()->create(['year' => 2026, 'month' => 3, 'amount' => 60]);
    $subcategory->budgets()->create(['year' => 2027, 'month' => 3, 'amount' => 65]);

    $response = $this->get('/pressupostos?year=2026');

    $response->assertInertia(fn ($page) => $page
        ->component('Pressupostos/Index')
        ->where('year', 2026)
        ->has('budgets', 1)
        ->where('budgets.0.amount', '60.00')
    );
});

test('the budgets index page defaults to the current year', function () {
    $response = $this->get('/pressupostos');

    $response->assertInertia(fn ($page) => $page->where('year', (int) now()->format('Y')));
});

test('a budget amount can be created for a subcategory and month', function () {
    $subcategory = createBudgetSubcategory();

    $response = $this->post('/pressupostos', [
        'subcategory_id' => $subcategory->id,
        'year' => 2026,
        'month' => 5,
        'amount' => 55.5,
    ]);

    $response->assertRedirect();
    expect(Budget::count())->toBe(1);
    expect((float) Budget::first()->amount)->toBe(55.5);
});

test('saving a budget amount twice updates the existing row instead of duplicating it', function () {
    $subcategory = createBudgetSubcategory();

    $this->post('/pressupostos', [
        'subcategory_id' => $subcategory->id,
        'year' => 2026,
        'month' => 5,
        'amount' => 55.5,
    ]);

    $this->post('/pressupostos', [
        'subcategory_id' => $subcategory->id,
        'year' => 2026,
        'month' => 5,
        'amount' => 70,
    ]);

    expect(Budget::count())->toBe(1);
    expect((float) Budget::first()->amount)->toBe(70.0);
});

test('sending a null amount deletes an existing budget for that month', function () {
    $subcategory = createBudgetSubcategory();
    $subcategory->budgets()->create(['year' => 2026, 'month' => 5, 'amount' => 55.5]);

    $response = $this->post('/pressupostos', [
        'subcategory_id' => $subcategory->id,
        'year' => 2026,
        'month' => 5,
        'amount' => null,
    ]);

    $response->assertRedirect();
    expect(Budget::count())->toBe(0);
});

test('the budget amount and month are validated', function () {
    $subcategory = createBudgetSubcategory();

    $response = $this->post('/pressupostos', [
        'subcategory_id' => $subcategory->id,
        'year' => 2026,
        'month' => 13,
        'amount' => -5,
    ]);

    $response->assertSessionHasErrors(['month', 'amount']);
    expect(Budget::count())->toBe(0);
});

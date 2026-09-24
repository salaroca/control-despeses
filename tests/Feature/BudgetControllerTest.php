<?php

use App\Models\Bank;
use App\Models\Budget;
use App\Models\Category;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

function createBudgetSubcategory()
{
    $category = Category::create(['name' => 'Subministres']);

    return $category->subcategories()->create(['name' => 'Electricitat']);
}

test('the budgets index page renders the budgets for the requested year', function () {
    $subcategory = createBudgetSubcategory();
    $subcategory->budgets()->create(['year' => 2026, 'month' => 3, 'amount' => 60]);
    $subcategory->budgets()->create(['year' => 2027, 'month' => 3, 'amount' => 65]);

    $subcategory->expenses()->create(['amount' => 45, 'date' => '2026-03-10']);

    $response = $this->get('/pressupostos?year=2026');

    $response->assertInertia(fn ($page) => $page
        ->component('Pressupostos/Index')
        ->where('year', 2026)
        ->has('budgets', 1)
        ->where('budgets.0.amount', '60.00')
        ->has('actuals', 1)
        ->where('actuals.0', [
            'subcategory_id' => $subcategory->id,
            'month' => 3,
            'total' => 45,
        ])
    );
});

test('the budgets index page sends the real expense per bank, using the bank of each expense', function () {
    $subcategory = createBudgetSubcategory();
    $bank = Bank::create(['name' => 'Banc A']);

    $subcategory->expenses()->create(['amount' => 30, 'date' => '2026-03-05', 'bank_id' => $bank->id]);
    $subcategory->expenses()->create(['amount' => 20, 'date' => '2026-03-15', 'bank_id' => $bank->id]);
    $subcategory->expenses()->create(['amount' => 12, 'date' => '2026-03-20']);
    $subcategory->expenses()->create(['amount' => 99, 'date' => '2027-03-20', 'bank_id' => $bank->id]);

    $response = $this->get('/pressupostos?year=2026');

    $response->assertInertia(fn ($page) => $page
        ->has('bankActuals', 2)
        ->where('bankActuals', fn ($rows) => collect($rows)->contains(fn ($row) => $row['bank_id'] === $bank->id
                && $row['month'] === 3
                && (float) $row['total'] === 50.0)
            && collect($rows)->contains(fn ($row) => $row['bank_id'] === null
                && $row['month'] === 3
                && (float) $row['total'] === 12.0))
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

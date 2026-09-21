<?php

use App\Models\Bank;
use App\Models\Category;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('the dashboard renders with the totals for the requested month and year', function () {
    $menjar = Category::create(['name' => 'Menjar']);
    $supermercats = $menjar->subcategories()->create(['name' => 'Supermercats']);

    $transport = Category::create(['name' => 'Transport']);
    $gasolina = $transport->subcategories()->create(['name' => 'Gasolina']);

    $bank = Bank::create(['name' => 'Banc A']);

    $supermercats->expenses()->create(['amount' => 40, 'date' => '2026-03-05', 'bank_id' => $bank->id]);
    $supermercats->expenses()->create(['amount' => 10, 'date' => '2026-03-20']);
    $gasolina->expenses()->create(['amount' => 25, 'date' => '2026-03-12', 'bank_id' => $bank->id]);
    // An expense in a different month must not be counted for the monthly totals.
    $gasolina->expenses()->create(['amount' => 999, 'date' => '2026-04-01']);

    $supermercats->budgets()->create(['year' => 2026, 'month' => 3, 'amount' => 60]);
    $gasolina->budgets()->create(['year' => 2026, 'month' => 3, 'amount' => 20]);

    $response = $this->get('/dashboard?year=2026&month=3');

    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Index')
        ->where('year', 2026)
        ->where('month', 3)
        ->where('monthlyTotal', 75)
        ->where('monthlyBudget', 80)
        ->where('annualTotal', 1074)
        ->where('annualBudget', 80)
        ->where('byCategory', [
            ['name' => 'Menjar', 'total' => 50],
            ['name' => 'Transport', 'total' => 25],
        ])
        ->where('bySubcategory', [
            ['name' => 'Supermercats', 'total' => 50],
            ['name' => 'Gasolina', 'total' => 25],
        ])
        ->where('byBank', [
            ['name' => 'Banc A', 'total' => 65],
            ['name' => 'Sense banc', 'total' => 10],
        ])
        ->has('deviationTrend', 12)
        ->where('deviationTrend.11', ['year' => 2026, 'month' => 3, 'deviation' => 5])
    );
});

test('the deviation trend covers the 12 months up to and including the selected one, across a year boundary', function () {
    $subcategory = createBudgetSubcategoryForDeviation();
    $subcategory->expenses()->create(['amount' => 30, 'date' => '2026-02-10']);
    $subcategory->budgets()->create(['year' => 2026, 'month' => 2, 'amount' => 50]);

    $response = $this->get('/dashboard?year=2026&month=2');

    $response->assertInertia(fn ($page) => $page
        ->has('deviationTrend', 12)
        ->where('deviationTrend.0', ['year' => 2025, 'month' => 3, 'deviation' => 0])
        ->where('deviationTrend.11', ['year' => 2026, 'month' => 2, 'deviation' => 20])
    );
});

function createBudgetSubcategoryForDeviation()
{
    $category = Category::create(['name' => 'Oci']);

    return $category->subcategories()->create(['name' => 'Cinema']);
}

test('the dashboard defaults to the current month and year', function () {
    $response = $this->get('/dashboard');

    $response->assertInertia(fn ($page) => $page
        ->where('year', (int) now()->format('Y'))
        ->where('month', (int) now()->format('n'))
    );
});

test('a month with no expenses shows empty totals and breakdowns', function () {
    $response = $this->get('/dashboard?year=2026&month=1');

    $response->assertInertia(fn ($page) => $page
        ->where('monthlyTotal', 0)
        ->where('monthlyBudget', 0)
        ->where('byCategory', [])
        ->where('bySubcategory', [])
        ->where('byBank', [])
    );
});

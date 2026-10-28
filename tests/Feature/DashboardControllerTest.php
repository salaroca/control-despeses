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

test('the year comparison sends the monthly totals of the selected year and the previous one', function () {
    $subcategory = Category::create(['name' => 'Menjar'])->subcategories()->create(['name' => 'Supermercats']);

    $subcategory->expenses()->create(['amount' => 30, 'date' => '2026-01-10']);
    $subcategory->expenses()->create(['amount' => 15.5, 'date' => '2026-01-25']);
    $subcategory->expenses()->create(['amount' => 20, 'date' => '2026-03-02']);
    $subcategory->expenses()->create(['amount' => 40, 'date' => '2025-01-15']);
    $subcategory->expenses()->create(['amount' => 70, 'date' => '2025-12-31']);
    // Two years back must not be included.
    $subcategory->expenses()->create(['amount' => 999, 'date' => '2024-06-01']);

    $response = $this->get('/dashboard?year=2026&month=3');

    $response->assertInertia(fn ($page) => $page
        ->where('yearComparison.current', [45.5, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        ->where('yearComparison.previous', [40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70])
    );
});

test('the monthly budgets send the budget of each month of the selected year', function () {
    $subcategory = Category::create(['name' => 'Menjar'])->subcategories()->create(['name' => 'Supermercats']);
    $other = Category::create(['name' => 'Transport'])->subcategories()->create(['name' => 'Gasolina']);

    $subcategory->budgets()->create(['year' => 2026, 'month' => 1, 'amount' => 100]);
    $other->budgets()->create(['year' => 2026, 'month' => 1, 'amount' => 50]);
    $subcategory->budgets()->create(['year' => 2026, 'month' => 12, 'amount' => 80]);
    // Another year must not be included.
    $subcategory->budgets()->create(['year' => 2025, 'month' => 2, 'amount' => 999]);

    $response = $this->get('/dashboard?year=2026&month=3');

    $response->assertInertia(fn ($page) => $page
        ->where('monthlyBudgets', [150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 80])
    );
});

test('the category comparison covers january to the selected month of both years, biggest increase first', function () {
    $menjar = Category::create(['name' => 'Menjar'])->subcategories()->create(['name' => 'Supermercats']);
    $transport = Category::create(['name' => 'Transport'])->subcategories()->create(['name' => 'Gasolina']);
    $oci = Category::create(['name' => 'Oci'])->subcategories()->create(['name' => 'Cinema']);

    $menjar->expenses()->create(['amount' => 100, 'date' => '2026-02-10']);
    $menjar->expenses()->create(['amount' => 60, 'date' => '2025-03-31']);
    // After the selected month: must not count in either year.
    $menjar->expenses()->create(['amount' => 999, 'date' => '2026-04-01']);
    $menjar->expenses()->create(['amount' => 999, 'date' => '2025-04-01']);
    $transport->expenses()->create(['amount' => 30, 'date' => '2025-01-05']);
    $oci->expenses()->create(['amount' => 10, 'date' => '2026-01-20']);

    $response = $this->get('/dashboard?year=2026&month=3');

    $response->assertInertia(fn ($page) => $page
        ->where('categoryComparison', [
            ['name' => 'Menjar', 'current' => 100, 'previous' => 60, 'subcategories' => [
                ['name' => 'Supermercats', 'current' => 100, 'previous' => 60],
            ]],
            ['name' => 'Oci', 'current' => 10, 'previous' => 0, 'subcategories' => [
                ['name' => 'Cinema', 'current' => 10, 'previous' => 0],
            ]],
            ['name' => 'Transport', 'current' => 0, 'previous' => 30, 'subcategories' => [
                ['name' => 'Gasolina', 'current' => 0, 'previous' => 30],
            ]],
        ])
    );
});

test('each category of the comparison breaks down into its subcategories, biggest increase first', function () {
    $salut = Category::create(['name' => 'Salut']);
    $farmacia = $salut->subcategories()->create(['name' => 'Farmàcia']);
    $consultoris = $salut->subcategories()->create(['name' => 'Consultoris']);

    $farmacia->expenses()->create(['amount' => 50, 'date' => '2026-02-01']);
    $farmacia->expenses()->create(['amount' => 20, 'date' => '2025-02-01']);
    $consultoris->expenses()->create(['amount' => 10, 'date' => '2026-01-10']);
    $consultoris->expenses()->create(['amount' => 40, 'date' => '2025-01-10']);

    $this->get('/dashboard?year=2026&month=3')->assertInertia(fn ($page) => $page
        ->where('categoryComparison.0.name', 'Salut')
        ->where('categoryComparison.0.current', 60)
        ->where('categoryComparison.0.previous', 60)
        ->where('categoryComparison.0.subcategories', [
            ['name' => 'Farmàcia', 'current' => 50, 'previous' => 20],
            ['name' => 'Consultoris', 'current' => 10, 'previous' => 40],
        ])
    );
});

test('for the current month the comparison stops at today in both years', function () {
    $this->travelTo(now()->setDate(2026, 10, 19));
    $subcategory = Category::create(['name' => 'Menjar'])->subcategories()->create(['name' => 'Supermercats']);

    $subcategory->expenses()->create(['amount' => 10, 'date' => '2026-10-19']);
    $subcategory->expenses()->create(['amount' => 20, 'date' => '2025-10-19']);
    // After today's day: must not count in either year.
    $subcategory->expenses()->create(['amount' => 500, 'date' => '2025-10-20']);
    $subcategory->expenses()->create(['amount' => 500, 'date' => '2026-10-25']);

    $this->get('/dashboard?year=2026&month=10')->assertInertia(fn ($page) => $page
        ->where('comparisonPeriod', ['cutoffDay' => 19, 'current' => 10, 'previous' => 20])
        ->where('categoryComparison.0.current', 10)
        ->where('categoryComparison.0.previous', 20)
    );
});

test('for a past month the comparison covers the whole month', function () {
    $this->travelTo(now()->setDate(2026, 10, 19));
    $subcategory = Category::create(['name' => 'Menjar'])->subcategories()->create(['name' => 'Supermercats']);

    $subcategory->expenses()->create(['amount' => 10, 'date' => '2026-06-30']);
    $subcategory->expenses()->create(['amount' => 20, 'date' => '2025-06-30']);

    $this->get('/dashboard?year=2026&month=6')->assertInertia(fn ($page) => $page
        ->where('comparisonPeriod', ['cutoffDay' => null, 'current' => 10, 'previous' => 20])
    );
});

test('the yearly totals list every year from the first expense up to the current one', function () {
    $this->travelTo(now()->setDate(2026, 10, 20));
    $subcategory = Category::create(['name' => 'Menjar'])->subcategories()->create(['name' => 'Supermercats']);

    $subcategory->expenses()->create(['amount' => 100, 'date' => '2024-05-01']);
    $subcategory->expenses()->create(['amount' => 50, 'date' => '2026-02-01']);
    $subcategory->expenses()->create(['amount' => 25, 'date' => '2026-10-01']);
    $subcategory->budgets()->create(['year' => 2026, 'month' => 1, 'amount' => 300]);
    // A future year's budget does not add a row.
    $subcategory->budgets()->create(['year' => 2027, 'month' => 1, 'amount' => 999]);

    $this->get('/dashboard')->assertInertia(fn ($page) => $page
        ->where('yearlyTotals', [
            ['year' => 2024, 'spent' => 100, 'budgeted' => 0, 'monthsCounted' => 12, 'isCurrent' => false],
            // A year without expenses in between still shows, at zero.
            ['year' => 2025, 'spent' => 0, 'budgeted' => 0, 'monthsCounted' => 12, 'isCurrent' => false],
            ['year' => 2026, 'spent' => 75, 'budgeted' => 300, 'monthsCounted' => 10, 'isCurrent' => true],
        ])
    );
});

test('the yearly totals are empty when there are no expenses', function () {
    $this->get('/dashboard')->assertInertia(fn ($page) => $page->where('yearlyTotals', []));
});

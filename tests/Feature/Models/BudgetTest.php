<?php

use App\Models\Category;

test('a budget belongs to a subcategory', function () {
    $category = Category::create(['name' => 'Subministres']);
    $subcategory = $category->subcategories()->create(['name' => 'Electricitat']);

    $budget = $subcategory->budgets()->create([
        'year' => 2026,
        'month' => 9,
        'amount' => 60,
    ]);

    expect($budget->subcategory->is($subcategory))->toBeTrue();
});

test('a subcategory cannot have two budgets for the same year and month', function () {
    $category = Category::create(['name' => 'Subministres']);
    $subcategory = $category->subcategories()->create(['name' => 'Electricitat']);

    $subcategory->budgets()->create(['year' => 2026, 'month' => 9, 'amount' => 60]);
    $subcategory->budgets()->create(['year' => 2026, 'month' => 9, 'amount' => 70]);
})->throws(Illuminate\Database\QueryException::class);

test('a subcategory can have budgets for different months', function () {
    $category = Category::create(['name' => 'Subministres']);
    $subcategory = $category->subcategories()->create(['name' => 'Electricitat']);

    $subcategory->budgets()->create(['year' => 2026, 'month' => 9, 'amount' => 60]);
    $subcategory->budgets()->create(['year' => 2026, 'month' => 10, 'amount' => 65]);

    expect($subcategory->budgets)->toHaveCount(2);
});

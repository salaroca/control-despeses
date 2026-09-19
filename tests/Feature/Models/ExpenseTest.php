<?php

use App\Models\Category;

test('an expense belongs to a subcategory', function () {
    $category = Category::create(['name' => 'Menjar']);
    $subcategory = $category->subcategories()->create(['name' => 'Supermercats']);

    $expense = $subcategory->expenses()->create([
        'amount' => 45.90,
        'date' => '2026-09-19',
        'note' => 'Compra setmanal',
    ]);

    expect($expense->subcategory->is($subcategory))->toBeTrue()
        ->and((float) $expense->amount)->toBe(45.90);
});

test('an expense note is optional', function () {
    $category = Category::create(['name' => 'Menjar']);
    $subcategory = $category->subcategories()->create(['name' => 'Supermercats']);

    $expense = $subcategory->expenses()->create([
        'amount' => 10,
        'date' => '2026-09-19',
    ]);

    expect($expense->note)->toBeNull();
});

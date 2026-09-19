<?php

use App\Models\Category;
use App\Models\Subcategory;

test('a category can be created', function () {
    $category = Category::create(['name' => 'Subministres']);

    expect($category->name)->toBe('Subministres');
});

test('a category name must be unique', function () {
    Category::create(['name' => 'Subministres']);
    Category::create(['name' => 'Subministres']);
})->throws(Illuminate\Database\QueryException::class);

test('a category has many subcategories', function () {
    $category = Category::create(['name' => 'Subministres']);
    $category->subcategories()->create(['name' => 'Electricitat']);
    $category->subcategories()->create(['name' => 'Aigua']);

    expect($category->subcategories)->toHaveCount(2)
        ->and($category->subcategories->first())->toBeInstanceOf(Subcategory::class);
});

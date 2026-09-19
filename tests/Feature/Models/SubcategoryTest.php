<?php

use App\Models\Category;

test('a subcategory belongs to a category', function () {
    $category = Category::create(['name' => 'Subministres']);
    $subcategory = $category->subcategories()->create(['name' => 'Electricitat']);

    expect($subcategory->category->is($category))->toBeTrue();
});

test('two subcategories in the same category cannot share a name', function () {
    $category = Category::create(['name' => 'Subministres']);
    $category->subcategories()->create(['name' => 'Electricitat']);
    $category->subcategories()->create(['name' => 'Electricitat']);
})->throws(Illuminate\Database\QueryException::class);

test('two subcategories in different categories can share a name', function () {
    $subministres = Category::create(['name' => 'Subministres']);
    $lucki = Category::create(['name' => 'Lucki (mascota)']);

    $subministres->subcategories()->create(['name' => 'Menjar']);
    $subcategory = $lucki->subcategories()->create(['name' => 'Menjar']);

    expect($subcategory->exists)->toBeTrue();
});

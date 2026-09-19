<?php

use App\Models\Category;
use Database\Seeders\CategorySeeder;

test('the category seeder creates the initial categories and subcategories', function () {
    $this->seed(CategorySeeder::class);

    expect(Category::count())->toBe(11);

    $menjar = Category::where('name', 'Menjar')->firstOrFail();
    expect($menjar->subcategories->pluck('name')->toArray())->toContain('Supermercats');
});

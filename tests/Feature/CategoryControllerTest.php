<?php

use App\Models\Category;

test('the categories index page renders with the shared categories list', function () {
    Category::create(['name' => 'Menjar']);

    $response = $this->get('/categories');

    $response->assertInertia(fn ($page) => $page
        ->component('Categories/Index')
        ->has('categoriesList', 1)
        ->where('categoriesList.0.name', 'Menjar')
    );
});

test('a category can be created', function () {
    $response = $this->post('/categories', ['name' => 'Oci']);

    $response->assertRedirect();
    expect(Category::where('name', 'Oci')->exists())->toBeTrue();
});

test('a category name must be unique', function () {
    Category::create(['name' => 'Oci']);

    $response = $this->post('/categories', ['name' => 'Oci']);

    $response->assertSessionHasErrors('name');
    expect(Category::count())->toBe(1);
});

test('a category can be updated', function () {
    $category = Category::create(['name' => 'Oci']);

    $response = $this->put("/categories/{$category->id}", ['name' => 'Oci i lleure']);

    $response->assertRedirect();
    expect($category->refresh()->name)->toBe('Oci i lleure');
});

test('updating a category keeps its own name valid against the unique rule', function () {
    $category = Category::create(['name' => 'Oci']);

    $response = $this->put("/categories/{$category->id}", ['name' => 'Oci']);

    $response->assertSessionHasNoErrors();
});

test('a category without expenses can be deleted', function () {
    $category = Category::create(['name' => 'Oci']);
    $category->subcategories()->create(['name' => 'Cinema']);

    $response = $this->delete("/categories/{$category->id}");

    $response->assertRedirect();
    expect(Category::count())->toBe(0);
});

test('a category cannot be deleted when one of its subcategories has expenses', function () {
    $category = Category::create(['name' => 'Oci']);
    $subcategory = $category->subcategories()->create(['name' => 'Cinema']);
    $subcategory->expenses()->create(['amount' => 10, 'date' => '2026-09-19']);

    $response = $this->delete("/categories/{$category->id}");

    $response->assertSessionHasErrors('delete');
    expect(Category::count())->toBe(1);
});

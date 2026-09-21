<?php

use App\Models\Category;
use App\Models\Subcategory;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('a subcategory can be created for a category', function () {
    $category = Category::create(['name' => 'Menjar']);

    $response = $this->post('/subcategories', [
        'category_id' => $category->id,
        'name' => 'Supermercats',
    ]);

    $response->assertRedirect();
    expect(Subcategory::where('name', 'Supermercats')->exists())->toBeTrue();
});

test('a subcategory name must be unique within its category', function () {
    $category = Category::create(['name' => 'Menjar']);
    $category->subcategories()->create(['name' => 'Supermercats']);

    $response = $this->post('/subcategories', [
        'category_id' => $category->id,
        'name' => 'Supermercats',
    ]);

    $response->assertSessionHasErrors('name');
    expect(Subcategory::count())->toBe(1);
});

test('the same subcategory name is allowed in a different category', function () {
    $menjar = Category::create(['name' => 'Menjar']);
    $menjar->subcategories()->create(['name' => 'Preferits']);
    $oci = Category::create(['name' => 'Oci']);

    $response = $this->post('/subcategories', [
        'category_id' => $oci->id,
        'name' => 'Preferits',
    ]);

    $response->assertRedirect();
    expect(Subcategory::count())->toBe(2);
});

test('a subcategory can be updated', function () {
    $category = Category::create(['name' => 'Menjar']);
    $subcategory = $category->subcategories()->create(['name' => 'Supers']);

    $response = $this->put("/subcategories/{$subcategory->id}", [
        'category_id' => $category->id,
        'name' => 'Supermercats',
    ]);

    $response->assertRedirect();
    expect($subcategory->refresh()->name)->toBe('Supermercats');
});

test('a subcategory without expenses can be deleted', function () {
    $category = Category::create(['name' => 'Menjar']);
    $subcategory = $category->subcategories()->create(['name' => 'Supermercats']);

    $response = $this->delete("/subcategories/{$subcategory->id}");

    $response->assertRedirect();
    expect(Subcategory::count())->toBe(0);
});

test('a subcategory with expenses cannot be deleted', function () {
    $category = Category::create(['name' => 'Menjar']);
    $subcategory = $category->subcategories()->create(['name' => 'Supermercats']);
    $subcategory->expenses()->create(['amount' => 10, 'date' => '2026-09-19']);

    $response = $this->delete("/subcategories/{$subcategory->id}");

    $response->assertSessionHasErrors('delete');
    expect(Subcategory::count())->toBe(1);
});

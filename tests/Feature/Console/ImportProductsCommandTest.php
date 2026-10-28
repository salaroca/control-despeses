<?php

use App\Models\Product;
use Illuminate\Support\Facades\File;

function makeIngredientsFolder(array $noteList): string
{
    $folder = sys_get_temp_dir().'/ingredients-'.uniqid();
    File::makeDirectory($folder);

    foreach ($noteList as $fileName => $content) {
        file_put_contents("{$folder}/{$fileName}", $content);
    }

    return $folder;
}

test('it imports one product per note, with the group from the frontmatter', function () {
    $folder = makeIngredientsFolder([
        'Arròs.md' => "---\nComprar: false\nGrup: Cereal\nOn es compra:\n  - Bon Preu\n---\n",
        'Alvocat.md' => "---\nGrup: Fruites i Verdures\n---\nText de la nota",
        'Aigua.md' => "---\nComprar: false\nGrup:\n---\n",
        'Sense frontmatter.md' => "Només text",
        'imatge.png' => 'no és una nota',
    ]);

    $this->artisan('app:import-products', ['folder' => $folder])->assertSuccessful();

    expect(Product::orderBy('name')->get(['name', 'group'])->toArray())->toBe([
        ['name' => 'Aigua', 'group' => null],
        ['name' => 'Alvocat', 'group' => 'Fruites i Verdures'],
        ['name' => 'Arròs', 'group' => 'Cereal'],
        ['name' => 'Sense frontmatter', 'group' => null],
    ]);
    // It only reads the notes: nothing in the folder changes.
    expect(file_get_contents("{$folder}/Arròs.md"))->toContain('Grup: Cereal');
});

test('it skips products that already exist, ignoring case and accents', function () {
    Product::create(['name' => 'Arros', 'group' => 'El meu grup']);
    $folder = makeIngredientsFolder([
        'Arròs.md' => "---\nGrup: Cereal\n---\n",
        'Pasta.md' => "---\nGrup: Cereal\n---\n",
    ]);

    $this->artisan('app:import-products', ['folder' => $folder])
        ->expectsOutputToContain('Ja existien')
        ->assertSuccessful();

    expect(Product::count())->toBe(2)
        ->and(Product::where('name', 'Arros')->value('group'))->toBe('El meu grup');
});

test('dry run does not save anything', function () {
    $folder = makeIngredientsFolder(['Arròs.md' => "---\nGrup: Cereal\n---\n"]);

    $this->artisan('app:import-products', ['folder' => $folder, '--dry-run' => true])
        ->expectsOutputToContain('Simulació')
        ->assertSuccessful();

    expect(Product::count())->toBe(0);
});

test('it fails when the folder does not exist', function () {
    $this->artisan('app:import-products', ['folder' => '/no/existeix'])->assertFailed();
});

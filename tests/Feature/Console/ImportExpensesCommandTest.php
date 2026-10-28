<?php

use App\Models\Bank;
use App\Models\Category;
use App\Models\Expense;

function writeImportCsv(array $lineList): string
{
    $path = tempnam(sys_get_temp_dir(), 'import').'.csv';
    file_put_contents($path, implode("\n", $lineList));

    return $path;
}

beforeEach(function () {
    $menjar = Category::create(['name' => 'Menjar']);
    $this->supermarkets = $menjar->subcategories()->create(['name' => 'Supermercats']);
    $this->greengrocer = $menjar->subcategories()->create(['name' => 'Fruiteria / Verdures']);

    $salut = Category::create(['name' => 'Salut']);
    $this->pharmacy = $salut->subcategories()->create(['name' => 'Farmàcia']);

    $transport = Category::create(['name' => 'Transport']);
    $this->publicParking = $transport->subcategories()->create(['name' => 'Pàrquing públic']);
});

test('it imports classified expenses as positive amounts, using the notes or the movement as note', function () {
    $path = writeImportCsv([
        'Moviments del compte',
        'Imports expressats en euros',
        'Data,Moviment,Més dades,Import,Categoria,Subcategoria,Banc,Notes',
        '31/12/2025,MERCADONA SANT JA,,-25.70,Menjar,Supermercats,CaixaBank,Mercadona',
        '31/12/2025,FARMACIA FELISA B,,-10.73,Salud,Farmacia,CaixaBank,',
    ]);

    $this->artisan('app:import-expenses', ['file' => $path])->assertSuccessful();

    expect(Expense::count())->toBe(2);

    $supermarketExpense = Expense::where('subcategory_id', $this->supermarkets->id)->first();
    expect($supermarketExpense->amount)->toBe('25.70')
        ->and($supermarketExpense->date->format('Y-m-d'))->toBe('2025-12-31')
        ->and($supermarketExpense->note)->toBe('Mercadona');

    $pharmacyExpense = Expense::where('subcategory_id', $this->pharmacy->id)->first();
    expect($pharmacyExpense->note)->toBe('FARMACIA FELISA B');
});

test('it matches names ignoring accents, case and spacing around slashes, and applies aliases', function () {
    $path = writeImportCsv([
        'Data,Moviment,Import,Categoria,Subcategoria,Notes',
        '15/12/2025,AO VIC 2 ALIMENTA,-29.26,menjar,Fruiteria/Verdures,',
        '24/12/2025,AP.PLACA MAJOR V,-6.20,Transport,Parking Public,',
    ]);

    $this->artisan('app:import-expenses', ['file' => $path])->assertSuccessful();

    expect(Expense::where('subcategory_id', $this->greengrocer->id)->count())->toBe(1)
        ->and(Expense::where('subcategory_id', $this->publicParking->id)->count())->toBe(1);
});

test('it skips unclassified rows, income and unknown subcategories', function () {
    $path = writeImportCsv([
        'Data,Moviment,Import,Categoria,Subcategoria,Notes',
        '31/12/2025,Despeses mensuals,-1300,,,',
        '30/12/2025,Nòmina,1500,Menjar,Supermercats,',
        '29/12/2025,Botiga,-10,Menjar,Inexistent,',
        '28/12/2025,BON PREU,-12.56,Menjar,Supermercats,',
    ]);

    $this->artisan('app:import-expenses', ['file' => $path])
        ->expectsOutputToContain('Subcategoria no trobada: Menjar > Inexistent (1)')
        ->assertSuccessful();

    expect(Expense::count())->toBe(1);
});

test('it skips rows that already exist with the same date and amount, but keeps identical rows inside the file', function () {
    $this->supermarkets->expenses()->create(['amount' => 12.56, 'date' => '2025-12-28', 'note' => 'Ja hi era']);

    $path = writeImportCsv([
        'Data,Moviment,Import,Categoria,Subcategoria,Notes',
        '28/12/2025,ALDI VIC,-12.56,Menjar,Supermercats,',
        '27/12/2025,BON PREU,-5.00,Menjar,Supermercats,',
        '27/12/2025,BON PREU,-5.00,Menjar,Supermercats,',
    ]);

    $this->artisan('app:import-expenses', ['file' => $path])->assertSuccessful();

    expect(Expense::count())->toBe(3)
        ->and(Expense::where('note', 'Ja hi era')->count())->toBe(1);
});

test('it reads semicolon separated files with comma decimals and assigns the given bank', function () {
    $bank = Bank::create(['name' => 'CaixaBanc']);

    $path = writeImportCsv([
        'Data;Moviment;Import;Categoria;Subcategoria;Notes',
        '05/12/2025;BON PREU;-1.050,20 €;Menjar;Supermercats;Bon Preu',
    ]);

    $this->artisan('app:import-expenses', ['file' => $path, '--bank' => 'caixabanc'])->assertSuccessful();

    $expense = Expense::first();
    expect($expense->amount)->toBe('1050.20')
        ->and($expense->bank_id)->toBe($bank->id);
});

test('it fails when the bank does not exist', function () {
    $path = writeImportCsv(['Data,Moviment,Import,Categoria,Subcategoria,Notes']);

    $this->artisan('app:import-expenses', ['file' => $path, '--bank' => 'Inexistent'])->assertFailed();
});

test('it fails when the header row is missing', function () {
    $path = writeImportCsv(['una,dues,tres', '1,2,3']);

    $this->artisan('app:import-expenses', ['file' => $path])->assertFailed();
});

test('dry run does not save anything', function () {
    $path = writeImportCsv([
        'Data,Moviment,Import,Categoria,Subcategoria,Notes',
        '28/12/2025,BON PREU,-12.56,Menjar,Supermercats,',
    ]);

    $this->artisan('app:import-expenses', ['file' => $path, '--dry-run' => true])
        ->expectsOutputToContain('Simulació')
        ->assertSuccessful();

    expect(Expense::count())->toBe(0);
});

<?php

namespace App\Console\Commands;

use App\Models\Bank;
use App\Models\Expense;
use App\Models\Subcategory;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportExpensesCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'app:import-expenses
        {file : Fitxer CSV amb els moviments del compte}
        {--bank= : Nom del banc a assignar a totes les despeses importades}
        {--dry-run : Mostra el resum sense desar res a la base de dades}';

    /**
     * @var string
     */
    protected $description = "Importa despeses des d'un CSV de moviments bancaris (columnes Data, Moviment, Import, Categoria, Subcategoria, Notes)";

    /**
     * Category names used in the bank spreadsheet that are spelled differently in the app.
     * Keys are normalized (see normalize()).
     */
    private const CATEGORY_ALIASES = [
        'salud' => 'Salut',
    ];

    /**
     * "Category > Subcategory" pairs from the spreadsheet that map to a differently named
     * subcategory in the app. Keys are normalized; values are [category, subcategory] as in the app.
     */
    private const SUBCATEGORY_ALIASES = [
        'assegurances > mazda' => ['Assegurances', 'Despesa combinada (Mazda, Renault, Llar)'],
        'assegurances > vida' => ['Assegurances', 'Vida Assumpta'],
        'despeses domestiques > estetica' => ['Salut', 'Estètica'],
        'despeses domestiques > ' => ['Despeses domèstiques', 'Llar'],
        'impostos > taxa de residuus' => ['Impostos', 'Taxa de residus domèstics'],
        'impostos > impost circulacio' => ['Impostos', 'Impost de circulació'],
        'transport > lloguer parking' => ['Transport', 'Parking Lloguer'],
        'transport > parking public' => ['Transport', 'Pàrquing públic'],
    ];

    private const REQUIRED_COLUMNS = ['data', 'moviment', 'import', 'categoria', 'subcategoria'];

    public function handle(): int
    {
        $path = $this->argument('file');

        if (! is_readable($path)) {
            $this->error("No es pot llegir el fitxer: {$path}");

            return self::FAILURE;
        }

        $bankId = null;
        if ($bankName = $this->option('bank')) {
            $bank = Bank::all()->first(fn (Bank $bank) => $this->normalize($bank->name) === $this->normalize($bankName));

            if (! $bank) {
                $this->error("No existeix cap banc anomenat «{$bankName}».");

                return self::FAILURE;
            }

            $bankId = $bank->id;
        }

        $rowList = $this->readRows($path);

        if ($rowList === null) {
            $this->error('No s\'ha trobat la fila de capçalera (cal com a mínim: '.implode(', ', self::REQUIRED_COLUMNS).').');

            return self::FAILURE;
        }

        $subcategoryIndex = $this->buildSubcategoryIndex();

        // Existing expenses are loaded once, before importing, so that two identical lines
        // inside the same file (same day, same amount) are both imported.
        $existingKeyList = Expense::all()
            ->mapWithKeys(fn (Expense $expense) => [$this->duplicateKey($expense->date, (float) $expense->amount) => true]);

        $toInsertList = [];
        $duplicateCount = 0;
        $unclassifiedCount = 0;
        $incomeCount = 0;
        $unknownList = [];

        foreach ($rowList as $row) {
            $amount = $this->parseAmount($row['import']);

            if ($amount >= 0) {
                $incomeCount++;

                continue;
            }

            if (trim($row['categoria']) === '') {
                $unclassifiedCount++;

                continue;
            }

            $subcategoryId = $this->resolveSubcategoryId($row['categoria'], $row['subcategoria'], $subcategoryIndex);

            if ($subcategoryId === null) {
                $label = trim($row['categoria']).' > '.trim($row['subcategoria']);
                $unknownList[$label] = ($unknownList[$label] ?? 0) + 1;

                continue;
            }

            $date = $this->parseDate($row['data']);
            $amount = abs($amount);

            if ($existingKeyList->has($this->duplicateKey($date, $amount))) {
                $duplicateCount++;

                continue;
            }

            $note = trim($row['notes'] ?? '') !== '' ? trim($row['notes']) : trim($row['moviment']);

            $toInsertList[] = [
                'subcategory_id' => $subcategoryId,
                'bank_id' => $bankId,
                'amount' => $amount,
                'date' => $date->format('Y-m-d'),
                'note' => $note,
            ];
        }

        if (! $this->option('dry-run')) {
            DB::transaction(function () use ($toInsertList) {
                foreach ($toInsertList as $expenseData) {
                    Expense::create($expenseData);
                }
            });
        }

        $this->table(['Resultat', 'Moviments'], [
            [$this->option('dry-run') ? 'Es importarien' : 'Importades', count($toInsertList)],
            ['Duplicades (ja existien)', $duplicateCount],
            ['Sense categoria (ignorades)', $unclassifiedCount],
            ['Ingressos (ignorats)', $incomeCount],
            ['Categoria desconeguda (ignorades)', array_sum($unknownList)],
        ]);

        foreach ($unknownList as $label => $count) {
            $this->warn("Subcategoria no trobada: {$label} ({$count})");
        }

        if ($this->option('dry-run')) {
            $this->info('Simulació: no s\'ha desat res.');
        }

        return self::SUCCESS;
    }

    /**
     * Reads the CSV and returns one associative array per data row, keyed by the
     * normalized header names. Lines before the header (titles, etc.) are skipped.
     *
     * @return list<array<string, string>>|null
     */
    private function readRows(string $path): ?array
    {
        $handle = fopen($path, 'r');
        $firstLine = (string) fgets($handle);
        $delimiter = substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';
        rewind($handle);

        $headerList = null;
        $rowList = [];

        while (($cellList = fgetcsv($handle, null, $delimiter, '"', '')) !== false) {
            // Remove a possible UTF-8 BOM from the first cell.
            $cellList[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $cellList[0]);

            if ($headerList === null) {
                $normalizedList = array_map(fn ($cell) => $this->normalize((string) $cell), $cellList);

                if (array_diff(self::REQUIRED_COLUMNS, $normalizedList) === []) {
                    $headerList = $normalizedList;
                }

                continue;
            }

            if (count(array_filter($cellList, fn ($cell) => trim((string) $cell) !== '')) === 0) {
                continue;
            }

            $cellList = array_pad($cellList, count($headerList), '');
            $rowList[] = array_combine($headerList, array_slice($cellList, 0, count($headerList)));
        }

        fclose($handle);

        return $headerList === null ? null : $rowList;
    }

    /**
     * @return Collection<string, int> normalized "category > subcategory" => subcategory id
     */
    private function buildSubcategoryIndex(): Collection
    {
        return Subcategory::with('category')->get()->mapWithKeys(fn (Subcategory $subcategory) => [
            $this->pairKey($subcategory->category->name, $subcategory->name) => $subcategory->id,
        ]);
    }

    /**
     * @param  Collection<string, int>  $subcategoryIndex
     */
    private function resolveSubcategoryId(string $category, string $subcategory, Collection $subcategoryIndex): ?int
    {
        $sourceKey = $this->pairKey($category, $subcategory);

        if (isset(self::SUBCATEGORY_ALIASES[$sourceKey])) {
            [$category, $subcategory] = self::SUBCATEGORY_ALIASES[$sourceKey];
        } else {
            $category = self::CATEGORY_ALIASES[$this->normalize($category)] ?? $category;
        }

        return $subcategoryIndex->get($this->pairKey($category, $subcategory));
    }

    private function pairKey(string $category, string $subcategory): string
    {
        return $this->normalize($category).' > '.$this->normalize($subcategory);
    }

    /**
     * Lowercase, without accents and with uniform spacing, so that "Fruiteria/Verdures"
     * matches "Fruiteria / Verdures" and "Farmacia" matches "Farmàcia".
     */
    private function normalize(string $value): string
    {
        $value = Str::lower(Str::ascii(trim($value)));
        $value = preg_replace('/\s*\/\s*/', ' / ', $value);

        return preg_replace('/\s+/', ' ', $value);
    }

    /**
     * Accepts "-5.6", "-5,60" and "-1.300,00".
     */
    private function parseAmount(string $value): float
    {
        $value = str_replace(['€', ' '], '', $value);

        if (str_contains($value, ',')) {
            $value = str_replace(['.', ','], ['', '.'], $value);
        }

        return (float) $value;
    }

    /**
     * Accepts "31/12/2025" and "2025-12-31".
     */
    private function parseDate(string $value): Carbon
    {
        $value = trim($value);

        return str_contains($value, '/')
            ? Carbon::createFromFormat('d/m/Y', $value)->startOfDay()
            : Carbon::parse($value)->startOfDay();
    }

    private function duplicateKey(Carbon $date, float $amount): string
    {
        return $date->format('Y-m-d').'|'.number_format($amount, 2, '.', '');
    }
}

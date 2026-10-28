<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportProductsCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'app:import-products
        {folder : Carpeta amb una nota .md per ingredient (p. ex. 03-INGREDIENTS del vault d\'Obsidian)}
        {--dry-run : Mostra el resum sense desar res a la base de dades}';

    /**
     * @var string
     */
    protected $description = "Importa articles des d'una carpeta de notes d'Obsidian (nom del fitxer i camp «Grup» del frontmatter). Només llegeix les notes.";

    public function handle(): int
    {
        $folder = rtrim($this->argument('folder'), '/');

        if (! is_dir($folder)) {
            $this->error("No existeix la carpeta: {$folder}");

            return self::FAILURE;
        }

        // Existing names are compared ignoring case and accents, so re-running the import
        // (or a product already created by hand) never creates a duplicate.
        $existingNameList = Product::pluck('name')
            ->mapWithKeys(fn (string $name) => [$this->normalize($name) => true]);

        $toInsertList = [];
        $skippedCount = 0;

        foreach (glob("{$folder}/*.md") ?: [] as $path) {
            $name = trim(pathinfo($path, PATHINFO_FILENAME));
            $key = $this->normalize($name);

            if ($name === '' || $existingNameList->has($key)) {
                $skippedCount++;

                continue;
            }

            $existingNameList[$key] = true;
            $toInsertList[] = ['name' => $name, 'group' => $this->readGroup($path)];
        }

        if (! $this->option('dry-run')) {
            DB::transaction(function () use ($toInsertList) {
                foreach ($toInsertList as $productData) {
                    Product::create($productData);
                }
            });
        }

        $this->table(['Resultat', 'Articles'], [
            [$this->option('dry-run') ? "S'importarien" : 'Importats', count($toInsertList)],
            ['Ja existien (ignorats)', $skippedCount],
        ]);

        if ($this->option('dry-run')) {
            $this->info('Simulació: no s\'ha desat res.');
        }

        return self::SUCCESS;
    }

    /**
     * Value of the "Grup:" property in the note's YAML frontmatter, or null if it has none.
     */
    private function readGroup(string $path): ?string
    {
        $content = (string) file_get_contents($path);

        if (! preg_match('/\A---\R(.*?)\R---/s', $content, $frontmatter)) {
            return null;
        }

        if (! preg_match('/^Grup:[ \t]*(.*)$/m', $frontmatter[1], $match)) {
            return null;
        }

        $group = trim($match[1], " \t\"'");

        return $group !== '' ? $group : null;
    }

    private function normalize(string $value): string
    {
        return Str::lower(Str::ascii(trim($value)));
    }
}

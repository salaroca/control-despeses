<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Seed the initial categories and subcategories.
     */
    public function run(): void
    {
        $categories = [
            'Subministres' => ['Electricitat', 'Aigua', 'Gas'],
            'Menjar' => ['Supermercats'],
            'Crèdits' => ['Hipoteca', 'Crèdit cotxe'],
            'Impostos' => ['Escombraries', 'Impost de circulació'],
            'Assegurances' => ['Cotxe', 'Llar'],
            'Salut' => ['Farmàcia'],
            'Subscripcions' => ['Netflix'],
            'Transport' => ['Gasolina', 'Pàrquing públic'],
            'Oci' => ['Cinema', 'Teatre'],
            'Lucki (mascota)' => ['Veterinari', 'Menjar'],
            'Compres' => ['Electrodomèstics'],
        ];

        foreach ($categories as $categoryName => $subcategoryNames) {
            $category = Category::create(['name' => $categoryName]);

            foreach ($subcategoryNames as $subcategoryName) {
                $category->subcategories()->create(['name' => $subcategoryName]);
            }
        }
    }
}

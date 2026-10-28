<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePriceRequest;
use App\Http\Requests\UpdatePriceRequest;
use App\Models\Price;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PriceController extends Controller
{
    public function index(): Response
    {
        $prices = Price::query()
            ->with(['product:id,name,unit', 'shop:id,name'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(20);

        return Inertia::render('Preus/Index', [
            'prices' => $prices,
            'productsList' => Product::query()->orderBy('name')->get(['id', 'name', 'unit']),
            'shopsList' => Shop::query()->orderBy('name')->get(['id', 'name']),
            'brandsByProduct' => $this->brandsByProduct(),
        ]);
    }

    /**
     * For each product with prices: its options (shop + brand) with the latest price of each,
     * cheapest per kg, l or unit first.
     */
    public function comparison(): Response
    {
        $pricesByProduct = Price::query()
            ->with(['product:id,name,group,unit', 'shop:id,name'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get()
            ->groupBy('product_id');

        $comparisonList = $pricesByProduct
            ->map(fn (Collection $prices) => $this->compareProduct($prices))
            ->filter(fn (array $product) => $product['options'] !== [])
            ->sortBy(fn (array $product) => Str::lower(Str::ascii($product['name'])))
            ->values()
            ->all();

        return Inertia::render('Preus/Comparativa', [
            'comparisonList' => $comparisonList,
        ]);
    }

    public function store(StorePriceRequest $request): RedirectResponse
    {
        $price = Price::create($request->validated());
        $price->product->adoptUnitFrom($price->size_unit);

        return back();
    }

    public function update(UpdatePriceRequest $request, Price $price): RedirectResponse
    {
        $price->update($request->validated());
        $price->product->adoptUnitFrom($price->size_unit);

        return back();
    }

    public function destroy(Price $price): RedirectResponse
    {
        $price->delete();

        return back();
    }

    /**
     * The options of one product, from its prices (newest first). An option is a shop + brand
     * (brand compared ignoring case and spaces); only its latest price counts, older ones are
     * history. Prices in a unit other than the product's (if its unit was changed afterwards) are
     * left out, since they could not be compared.
     *
     * @param  Collection<int, Price>  $prices
     * @return array{id: int, name: string, group: string|null, unit: string|null, options: list<array<string, mixed>>}
     */
    private function compareProduct(Collection $prices): array
    {
        $product = $prices->first()->product;

        // Exact price per unit (not the rounded unit_price), so sorting, ties and differences are precise.
        $exactUnitPrice = fn (Price $price) => (float) $price->price / $price->base_quantity;

        $options = $prices
            ->filter(fn (Price $price) => $product->unit === null || $price->base_unit === $product->unit)
            ->unique(fn (Price $price) => $price->shop_id.'|'.Str::lower(trim((string) $price->brand)))
            ->sortBy($exactUnitPrice)
            ->values();

        $cheapestUnitPrice = $options->isNotEmpty() ? $exactUnitPrice($options->first()) : null;

        return [
            'id' => $product->id,
            'name' => $product->name,
            'group' => $product->group,
            'unit' => $product->unit,
            'options' => $options->map(fn (Price $price) => [
                'price_id' => $price->id,
                'shop' => $price->shop->name,
                'brand' => $price->brand,
                'price' => $price->price,
                'pack_count' => $price->pack_count,
                'size' => $price->size,
                'size_unit' => $price->size_unit,
                'date' => $price->date->format('Y-m-d'),
                'base_unit' => $price->base_unit,
                'unit_price' => $price->unit_price,
                // Ties count as cheapest too.
                'is_cheapest' => abs($exactUnitPrice($price) - $cheapestUnitPrice) < 0.000001,
                'difference' => $cheapestUnitPrice > 0
                    ? round(($exactUnitPrice($price) - $cheapestUnitPrice) / $cheapestUnitPrice, 4)
                    : 0,
            ])->all(),
        ];
    }

    /**
     * Brands already used for each product, to suggest them when typing the next price.
     *
     * @return array<int, list<string>>
     */
    private function brandsByProduct(): array
    {
        return Price::query()
            ->whereNotNull('brand')
            ->where('brand', '!=', '')
            ->select(['product_id', 'brand'])
            ->distinct()
            ->orderBy('brand')
            ->get()
            ->groupBy('product_id')
            ->map(fn ($rows) => $rows->pluck('brand')->values()->all())
            ->all();
    }
}

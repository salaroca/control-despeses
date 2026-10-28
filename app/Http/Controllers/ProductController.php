<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Articles/Index', [
            // prices_count: how many prices go away if the product is deleted (shown in the confirmation).
            'productsList' => Product::query()
                ->select(['id', 'name', 'group', 'unit'])
                ->withCount('prices')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        Product::create($request->validated());

        return back();
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        return back();
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return back();
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShopRequest;
use App\Http\Requests\UpdateShopRequest;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Botigues/Index', [
            // prices_count: how many prices go away if the shop is deleted (shown in the confirmation).
            'shopsList' => Shop::query()
                ->select(['id', 'name'])
                ->withCount('prices')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StoreShopRequest $request): RedirectResponse
    {
        Shop::create($request->validated());

        return back();
    }

    public function update(UpdateShopRequest $request, Shop $shop): RedirectResponse
    {
        $shop->update($request->validated());

        return back();
    }

    public function destroy(Shop $shop): RedirectResponse
    {
        $shop->delete();

        return back();
    }
}

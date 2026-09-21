<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubcategoryRequest;
use App\Http\Requests\UpdateSubcategoryRequest;
use App\Models\Subcategory;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;

class SubcategoryController extends Controller
{
    public function store(StoreSubcategoryRequest $request): RedirectResponse
    {
        Subcategory::create($request->validated());

        return back();
    }

    public function update(UpdateSubcategoryRequest $request, Subcategory $subcategory): RedirectResponse
    {
        $subcategory->update($request->validated());

        return back();
    }

    public function destroy(Subcategory $subcategory): RedirectResponse
    {
        try {
            $subcategory->delete();
        } catch (QueryException) {
            return back()->withErrors([
                'delete' => 'No es pot eliminar la subcategoria perquè té despeses associades.',
            ]);
        }

        return back();
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $subcategoryId = $request->integer('subcategory_id') ?: null;

        $expenses = Expense::query()
            ->with(['subcategory.category', 'bank'])
            ->when($search !== '', fn ($query) => $query->where('note', 'like', '%'.$search.'%'))
            ->when($subcategoryId, fn ($query) => $query->where('subcategory_id', $subcategoryId))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Despeses/Index', [
            'expenses' => $expenses,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'subcategory_id' => $subcategoryId,
            ],
        ]);
    }

    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        Expense::create($request->validated());

        return back();
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): RedirectResponse
    {
        $expense->update($request->validated());

        return back();
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        $expense->delete();

        return back();
    }
}

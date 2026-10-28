<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Bank;
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
            'lastEntryByBank' => $this->lastEntryByBank(),
        ]);
    }

    /**
     * Date of the most recent expense of each bank (null if it has none yet), so the user can see
     * up to which day each bank is filled in. Uses the expense date, not when it was typed in.
     *
     * @return array<int, array{name: string, date: string|null}>
     */
    private function lastEntryByBank(): array
    {
        return Bank::query()
            ->withMax('expenses', 'date')
            ->orderBy('name')
            ->get()
            ->map(fn (Bank $bank) => [
                'name' => $bank->name,
                'date' => $bank->expenses_max_date ? substr($bank->expenses_max_date, 0, 10) : null,
            ])
            ->all();
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

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBudgetRequest;
use App\Models\Budget;
use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BudgetController extends Controller
{
    public function index(Request $request): Response
    {
        $year = (int) $request->integer('year', (int) now()->format('Y'));

        $budgets = Budget::query()
            ->where('year', $year)
            ->get(['subcategory_id', 'month', 'amount']);

        $actuals = collect(range(1, 12))
            ->flatMap(fn (int $month) => Expense::query()
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->selectRaw('subcategory_id, SUM(amount) as total')
                ->groupBy('subcategory_id')
                ->get()
                ->map(fn ($row) => [
                    'subcategory_id' => $row->subcategory_id,
                    'month' => $month,
                    'total' => (float) $row->total,
                ]))
            ->values();

        return Inertia::render('Pressupostos/Index', [
            'year' => $year,
            'budgets' => $budgets,
            'actuals' => $actuals,
        ]);
    }

    public function upsert(StoreBudgetRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $criteria = [
            'subcategory_id' => $data['subcategory_id'],
            'year' => $data['year'],
            'month' => $data['month'],
        ];

        if ($data['amount'] === null) {
            Budget::where($criteria)->delete();
        } else {
            Budget::updateOrCreate($criteria, ['amount' => $data['amount']]);
        }

        return back();
    }
}

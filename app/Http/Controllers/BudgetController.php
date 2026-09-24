<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBudgetRequest;
use App\Models\Budget;
use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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

        return Inertia::render('Pressupostos/Index', [
            'year' => $year,
            'budgets' => $budgets,
            'actuals' => $this->monthlyExpenseTotals($year, 'subcategory_id'),
            // Grouped by the bank set on each expense (not the subcategory's bank),
            // so it reflects which account the money actually came out of.
            'bankActuals' => $this->monthlyExpenseTotals($year, 'bank_id'),
        ]);
    }

    /**
     * Real expense per month for the given year, summed by the given expense column.
     *
     * @return Collection<int, array{month: int, total: float}>
     */
    private function monthlyExpenseTotals(int $year, string $groupColumn): Collection
    {
        return collect(range(1, 12))
            ->flatMap(fn (int $month) => Expense::query()
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->selectRaw("{$groupColumn}, SUM(amount) as total")
                ->groupBy($groupColumn)
                ->get()
                ->map(fn ($row) => [
                    $groupColumn => $row->{$groupColumn},
                    'month' => $month,
                    'total' => (float) $row->total,
                ]))
            ->values();
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

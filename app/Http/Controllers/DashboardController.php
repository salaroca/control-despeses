<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $year = (int) $request->integer('year', (int) now()->format('Y'));
        $month = (int) $request->integer('month', (int) now()->format('n'));

        $monthlyTotal = (float) Expense::query()
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        $annualTotal = (float) Expense::query()
            ->whereYear('date', $year)
            ->sum('amount');

        $monthlyBudget = (float) Budget::query()
            ->where('year', $year)
            ->where('month', $month)
            ->sum('amount');

        $annualBudget = (float) Budget::query()
            ->where('year', $year)
            ->sum('amount');

        return Inertia::render('Dashboard/Index', [
            'year' => $year,
            'month' => $month,
            'monthlyTotal' => $monthlyTotal,
            'annualTotal' => $annualTotal,
            'monthlyBudget' => $monthlyBudget,
            'annualBudget' => $annualBudget,
            'byCategory' => $this->totalsByColumn($year, $month, 'categories.name'),
            'bySubcategory' => $this->totalsByColumn($year, $month, 'subcategories.name'),
            'byBank' => $this->totalsByBank($year, $month),
            'deviationTrend' => $this->deviationTrend($year, $month),
        ]);
    }

    /**
     * @return array<int, array{name: string, total: float}>
     */
    private function totalsByColumn(int $year, int $month, string $groupColumn): array
    {
        return Expense::query()
            ->join('subcategories', 'subcategories.id', '=', 'expenses.subcategory_id')
            ->join('categories', 'categories.id', '=', 'subcategories.category_id')
            ->whereYear('expenses.date', $year)
            ->whereMonth('expenses.date', $month)
            ->selectRaw("{$groupColumn} as name, SUM(expenses.amount) as total")
            ->groupBy($groupColumn)
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'total' => (float) $row->total])
            ->all();
    }

    /**
     * The bank is optional on an expense, so expenses without one are grouped
     * under "Sense banc" instead of being silently dropped from the breakdown.
     *
     * @return array<int, array{name: string, total: float}>
     */
    private function totalsByBank(int $year, int $month): array
    {
        return Expense::query()
            ->leftJoin('banks', 'banks.id', '=', 'expenses.bank_id')
            ->whereYear('expenses.date', $year)
            ->whereMonth('expenses.date', $month)
            ->selectRaw("COALESCE(banks.name, 'Sense banc') as name, SUM(expenses.amount) as total")
            ->groupBy('name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'total' => (float) $row->total])
            ->all();
    }

    /**
     * The last 12 months up to and including the selected month, so the frontend
     * can switch between a 3/6/12-month window without another request.
     *
     * @return array<int, array{year: int, month: int, deviation: float}>
     */
    private function deviationTrend(int $year, int $month): array
    {
        $selected = Carbon::create($year, $month, 1);

        return collect(range(11, 0))
            ->map(function (int $monthsAgo) use ($selected) {
                $date = $selected->copy()->subMonths($monthsAgo);

                $spent = (float) Expense::query()
                    ->whereYear('date', $date->year)
                    ->whereMonth('date', $date->month)
                    ->sum('amount');

                $budgeted = (float) Budget::query()
                    ->where('year', $date->year)
                    ->where('month', $date->month)
                    ->sum('amount');

                return [
                    'year' => $date->year,
                    'month' => $date->month,
                    'deviation' => $budgeted - $spent,
                ];
            })
            ->all();
    }
}

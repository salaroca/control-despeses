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
            'yearComparison' => [
                'current' => $this->monthlyTotals($year),
                'previous' => $this->monthlyTotals($year - 1),
            ],
            'monthlyBudgets' => $this->monthlyBudgets($year),
            'categoryComparison' => $this->categoryComparison($year, $month),
            'comparisonPeriod' => $this->comparisonPeriod($year, $month),
            'yearlyTotals' => $this->yearlyTotals(),
        ]);
    }

    /**
     * Spent and budgeted per year, from the first year with expenses up to the current one (a new
     * year shows up on its own). Independent of the month selector. monthsCounted is how many months
     * the year's expense covers so far (12 for past years, January to now for the current one), so
     * years can be compared by their monthly average even while the current one is in progress.
     *
     * @return array<int, array{year: int, spent: float, budgeted: float, monthsCounted: int, isCurrent: bool}>
     */
    private function yearlyTotals(): array
    {
        $spentByYear = Expense::query()
            ->selectRaw("CAST(strftime('%Y', date) AS INTEGER) as year, SUM(amount) as total")
            ->groupBy('year')
            ->pluck('total', 'year');

        if ($spentByYear->isEmpty()) {
            return [];
        }

        $budgetedByYear = Budget::query()
            ->selectRaw('year, SUM(amount) as total')
            ->groupBy('year')
            ->pluck('total', 'year');

        $currentYear = now()->year;
        $firstYear = min((int) $spentByYear->keys()->min(), $currentYear);

        return collect(range($firstYear, $currentYear))
            ->map(fn (int $forYear) => [
                'year' => $forYear,
                'spent' => (float) ($spentByYear[$forYear] ?? 0),
                'budgeted' => (float) ($budgetedByYear[$forYear] ?? 0),
                'monthsCounted' => $forYear === $currentYear ? now()->month : 12,
                'isCurrent' => $forYear === $currentYear,
            ])
            ->all();
    }

    /**
     * Budget of each month of the year, January first (12 values, 0 for months without budget).
     *
     * @return array<int, float>
     */
    private function monthlyBudgets(int $year): array
    {
        $totalByMonth = Budget::query()
            ->where('year', $year)
            ->selectRaw('month, SUM(amount) as total')
            ->groupBy('month')
            ->pluck('total', 'month');

        return collect(range(1, 12))
            ->map(fn (int $month) => (float) ($totalByMonth[$month] ?? 0))
            ->all();
    }

    /**
     * When the selected month is the current one, the comparison with the previous year stops at
     * today's day in both years (e.g. 1–19 October against 1–19 October), so a month in progress is
     * not compared against a complete one. For any other month the whole month counts (null).
     */
    private function comparisonCutoffDay(int $year, int $month): ?int
    {
        return $year === now()->year && $month === now()->month ? now()->day : null;
    }

    /**
     * Last day included in the comparison period of the given year: the cutoff day of the selected
     * month, or the end of that month.
     */
    private function comparisonPeriodEnd(int $forYear, int $month, ?int $cutoffDay): Carbon
    {
        $monthStart = Carbon::create($forYear, $month, 1);

        // February 29th does not exist every year.
        return $cutoffDay !== null
            ? $monthStart->copy()->day(min($cutoffDay, $monthStart->daysInMonth))
            : $monthStart->copy()->endOfMonth();
    }

    /**
     * Total spent from January 1st up to the end of the comparison period, in the selected year and
     * the previous one.
     *
     * @return array{cutoffDay: int|null, current: float, previous: float}
     */
    private function comparisonPeriod(int $year, int $month): array
    {
        $cutoffDay = $this->comparisonCutoffDay($year, $month);

        $totalFor = fn (int $forYear) => (float) Expense::query()
            ->whereDate('date', '>=', "{$forYear}-01-01")
            ->whereDate('date', '<=', $this->comparisonPeriodEnd($forYear, $month, $cutoffDay)->toDateString())
            ->sum('amount');

        return [
            'cutoffDay' => $cutoffDay,
            'current' => $totalFor($year),
            'previous' => $totalFor($year - 1),
        ];
    }

    /**
     * Spending per category, and per subcategory inside each category, over the comparison period
     * (January up to the selected month, cut at today's day for the current month) in the selected
     * year and the previous one. Both levels are sorted by the difference, biggest increase first.
     *
     * @return array<int, array{name: string, current: float, previous: float, subcategories: array<int, array{name: string, current: float, previous: float}>}>
     */
    private function categoryComparison(int $year, int $month): array
    {
        $cutoffDay = $this->comparisonCutoffDay($year, $month);

        $rowsFor = fn (int $forYear) => Expense::query()
            ->join('subcategories', 'subcategories.id', '=', 'expenses.subcategory_id')
            ->join('categories', 'categories.id', '=', 'subcategories.category_id')
            ->whereDate('expenses.date', '>=', "{$forYear}-01-01")
            ->whereDate('expenses.date', '<=', $this->comparisonPeriodEnd($forYear, $month, $cutoffDay)->toDateString())
            ->selectRaw('categories.name as category, subcategories.name as subcategory, SUM(expenses.amount) as total')
            ->groupBy('categories.name', 'subcategories.name')
            ->get()
            ->map(fn ($row) => ['category' => $row->category, 'subcategory' => $row->subcategory, 'year' => $forYear, 'total' => (float) $row->total]);

        $byDifference = fn (array $row) => $row['current'] - $row['previous'];

        return $rowsFor($year)
            ->concat($rowsFor($year - 1))
            ->groupBy('category')
            ->map(function ($categoryRows, string $category) use ($year, $byDifference) {
                $subcategories = $categoryRows
                    ->groupBy('subcategory')
                    ->map(fn ($rows, string $subcategory) => [
                        'name' => $subcategory,
                        'current' => $rows->where('year', $year)->sum('total'),
                        'previous' => $rows->where('year', '!=', $year)->sum('total'),
                    ])
                    ->sortByDesc($byDifference)
                    ->values();

                return [
                    'name' => $category,
                    'current' => $subcategories->sum('current'),
                    'previous' => $subcategories->sum('previous'),
                    'subcategories' => $subcategories->all(),
                ];
            })
            ->sortByDesc($byDifference)
            ->values()
            ->all();
    }

    /**
     * Total spent in each month of the year, January first (12 values, 0 for months without expenses).
     *
     * @return array<int, float>
     */
    private function monthlyTotals(int $year): array
    {
        $totalByMonth = Expense::query()
            ->whereYear('date', $year)
            ->selectRaw("CAST(strftime('%m', date) AS INTEGER) as month, SUM(amount) as total")
            ->groupBy('month')
            ->pluck('total', 'month');

        return collect(range(1, 12))
            ->map(fn (int $month) => (float) ($totalByMonth[$month] ?? 0))
            ->all();
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

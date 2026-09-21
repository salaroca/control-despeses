<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBudgetRequest;
use App\Models\Budget;
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

        return Inertia::render('Pressupostos/Index', [
            'year' => $year,
            'budgets' => $budgets,
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

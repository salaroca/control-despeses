<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBankRequest;
use App\Http\Requests\UpdateBankRequest;
use App\Models\Bank;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BankController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Bancs/Index');
    }

    public function store(StoreBankRequest $request): RedirectResponse
    {
        Bank::create($request->validated());

        return back();
    }

    public function update(UpdateBankRequest $request, Bank $bank): RedirectResponse
    {
        $bank->update($request->validated());

        return back();
    }

    public function destroy(Bank $bank): RedirectResponse
    {
        $bank->delete();

        return back();
    }
}

<?php

use App\Http\Controllers\ExpenseController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/despeses');

Route::get('/despeses', [ExpenseController::class, 'index'])->name('expenses.index');
Route::post('/despeses', [ExpenseController::class, 'store'])->name('expenses.store');
Route::put('/despeses/{expense}', [ExpenseController::class, 'update'])->name('expenses.update');
Route::delete('/despeses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');

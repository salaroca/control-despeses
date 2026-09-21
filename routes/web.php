<?php

use App\Http\Controllers\BudgetController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\SubcategoryController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/despeses');

Route::get('/despeses', [ExpenseController::class, 'index'])->name('expenses.index');
Route::post('/despeses', [ExpenseController::class, 'store'])->name('expenses.store');
Route::put('/despeses/{expense}', [ExpenseController::class, 'update'])->name('expenses.update');
Route::delete('/despeses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');

Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

Route::post('/subcategories', [SubcategoryController::class, 'store'])->name('subcategories.store');
Route::put('/subcategories/{subcategory}', [SubcategoryController::class, 'update'])->name('subcategories.update');
Route::delete('/subcategories/{subcategory}', [SubcategoryController::class, 'destroy'])->name('subcategories.destroy');

Route::get('/pressupostos', [BudgetController::class, 'index'])->name('budgets.index');
Route::post('/pressupostos', [BudgetController::class, 'upsert'])->name('budgets.upsert');

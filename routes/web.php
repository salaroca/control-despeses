<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\BankController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\PriceController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\SubcategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::redirect('/', '/despeses');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');

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

    Route::get('/bancs', [BankController::class, 'index'])->name('banks.index');
    Route::post('/bancs', [BankController::class, 'store'])->name('banks.store');
    Route::put('/bancs/{bank}', [BankController::class, 'update'])->name('banks.update');
    Route::delete('/bancs/{bank}', [BankController::class, 'destroy'])->name('banks.destroy');

    Route::get('/preus', [PriceController::class, 'index'])->name('prices.index');
    Route::get('/preus/comparativa', [PriceController::class, 'comparison'])->name('prices.comparison');
    Route::post('/preus', [PriceController::class, 'store'])->name('prices.store');
    Route::put('/preus/{price}', [PriceController::class, 'update'])->name('prices.update');
    Route::delete('/preus/{price}', [PriceController::class, 'destroy'])->name('prices.destroy');

    Route::get('/articles', [ProductController::class, 'index'])->name('products.index');
    Route::post('/articles', [ProductController::class, 'store'])->name('products.store');
    Route::put('/articles/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/articles/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

    Route::get('/botigues', [ShopController::class, 'index'])->name('shops.index');
    Route::post('/botigues', [ShopController::class, 'store'])->name('shops.store');
    Route::put('/botigues/{shop}', [ShopController::class, 'update'])->name('shops.update');
    Route::delete('/botigues/{shop}', [ShopController::class, 'destroy'])->name('shops.destroy');

    Route::get('/pressupostos', [BudgetController::class, 'index'])->name('budgets.index');
    Route::post('/pressupostos', [BudgetController::class, 'upsert'])->name('budgets.upsert');
});

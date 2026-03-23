<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PolicyController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth.token')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/policy/history', [PolicyController::class, 'index']);
    Route::post('/policy/analyze', [PolicyController::class, 'analyze']);
    Route::put('/policy/{policyAnalysis}/finalize', [PolicyController::class, 'finalize']);
});

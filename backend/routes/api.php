<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\PolicyController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth.token')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store'])->middleware('throttle:ai-daily');
    Route::post('/document/upload', [DocumentController::class, 'store'])->middleware('throttle:ai-daily');
    Route::post('/document/query', [DocumentController::class, 'query'])->middleware('throttle:ai-daily');
    Route::get('/policy/history', [PolicyController::class, 'index']);
    Route::post('/policy/analyze', [PolicyController::class, 'analyze'])->middleware('throttle:ai-daily');
    Route::put('/policy/{policyAnalysis}/finalize', [PolicyController::class, 'finalize']);
});

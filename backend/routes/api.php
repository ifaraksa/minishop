<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Support\ApiResponse;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
Route::get('/ping', fn () => ApiResponse::success(['app' => 'MiniShop']));
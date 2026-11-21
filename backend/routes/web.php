<?php

use App\Support\ApiResponse;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => ApiResponse::success([
    'app'    => 'MiniShop API',
    'status' => 'running',
]));

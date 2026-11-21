<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\CheckoutService;
use App\Support\ApiResponse;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request, CheckoutService $checkout)
    {
        $order = $checkout->checkout($request->validated());

        return ApiResponse::success(
            (new OrderResource($order))->resolve(),
            'Order berhasil dibuat',
            201,
        );
    }
}
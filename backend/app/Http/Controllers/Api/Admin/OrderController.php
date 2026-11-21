<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Support\ApiResponse;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::withCount('items')->latest()->paginate(15);

        return ApiResponse::success(
            OrderResource::collection($orders->getCollection())->resolve(),
            'OK',
            200,
            [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
            ],
        );
    }

    public function show(Order $order)
    {
        $order->load('items');

        return ApiResponse::success((new OrderResource($order))->resolve());
    }
}
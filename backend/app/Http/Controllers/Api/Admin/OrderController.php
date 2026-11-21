<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');

        $orders = Order::withCount('items')
            ->when(
                is_string($status) && in_array($status, ['pending', 'processing', 'shipped', 'completed', 'cancelled'], true),
                fn ($query) => $query->where('status', $status),
            )
            ->latest()
            ->paginate(15);

        return ApiResponse::paginated(
            $orders,
            OrderResource::collection($orders->getCollection())->resolve(),
        );
    }

    public function show(Order $order)
    {
        $order->load('items');

        return ApiResponse::success((new OrderResource($order))->resolve());
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order)
    {
        $newStatus = $request->validated('status');

        $updated = DB::transaction(function () use ($order, $newStatus) {
            $lockedOrder = Order::query()
                ->with('items')
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedOrder->status === 'cancelled' && $newStatus !== 'cancelled') {
                throw ValidationException::withMessages([
                    'status' => ['Order yang sudah dibatalkan tidak dapat diubah statusnya.'],
                ]);
            }

            // Kembalikan stok produk jika order dibatalkan
            if ($lockedOrder->status !== 'cancelled' && $newStatus === 'cancelled') {
                $productIds = $lockedOrder->items
                    ->pluck('product_id')
                    ->filter()
                    ->sort()
                    ->values();

                if ($productIds->isNotEmpty()) {
                    $products = Product::query()
                        ->whereIn('id', $productIds)
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->get()
                        ->keyBy('id');

                    foreach ($lockedOrder->items as $item) {
                        if ($item->product_id && isset($products[$item->product_id])) {
                            $products[$item->product_id]->increment('stock', $item->quantity);
                        }
                    }
                }
            }

            $lockedOrder->update(['status' => $newStatus]);

            return $lockedOrder->load('items')->loadCount('items');
        });

        return ApiResponse::success(
            (new OrderResource($updated))->resolve(),
            'Status order diperbarui',
        );
    }
}

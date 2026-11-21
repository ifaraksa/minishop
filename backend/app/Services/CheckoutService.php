<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $items = collect($data['items'])->sortBy('product_id')->values();

            // Kunci baris produk (urut id) sampai transaksi selesai
            $products = Product::query()
                ->whereIn('id', $items->pluck('product_id'))
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // 1) Cek semua stok dulu sebelum mengubah apa pun
            $shortages = [];
            foreach ($items as $item) {
                $product = $products[$item['product_id']];

                if ($product->stock < $item['quantity']) {
                    $shortages[] = [
                        'product_id' => $product->id,
                        'name'       => $product->name,
                        'requested'  => (int) $item['quantity'],
                        'available'  => $product->stock,
                    ];
                }
            }

            if ($shortages !== []) {
                throw new InsufficientStockException(['items' => $shortages]);
            }

            // 2) Hitung baris dan total memakai harga dari database
            $lines = [];
            $total = 0;
            foreach ($items as $item) {
                $product  = $products[$item['product_id']];
                $quantity = (int) $item['quantity'];
                $subtotal = $product->price * $quantity;
                $total   += $subtotal;

                $lines[] = [
                    'product_id'   => $product->id,
                    'product_name' => $product->name,
                    'unit_price'   => $product->price,
                    'quantity'     => $quantity,
                    'subtotal'     => $subtotal,
                ];
            }

            // 3) Simpan order dan item-itemnya
            $order = Order::create([
                'order_number'   => 'ORD-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6)),
                'customer_name'  => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'total_amount'   => $total,
                'status'         => 'pending',
            ]);

            $order->items()->createMany($lines);

            // 4) Kurangi stok
            foreach ($items as $item) {
                $products[$item['product_id']]->decrement('stock', (int) $item['quantity']);
            }

            return $order->load('items');
        });
    }
}
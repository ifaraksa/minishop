<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_creates_order_and_decrements_stock(): void
    {
        $category = Category::create(['name' => 'Elektronik', 'slug' => 'elektronik']);
        $earbuds = Product::create([
            'category_id' => $category->id,
            'name'        => 'Earbuds Pro',
            'price'       => 300000,
            'stock'       => 10,
        ]);
        $mouse = Product::create([
            'category_id' => $category->id,
            'name'        => 'Mouse Wireless',
            'price'       => 100000,
            'stock'       => 5,
        ]);

        $response = $this->postJson('/api/orders', [
            'customer_name'  => 'Budi Santoso',
            'customer_email' => 'budi@example.com',
            'customer_phone' => '081234567890',
            'items'          => [
                ['product_id' => $earbuds->id, 'quantity' => 2],
                ['product_id' => $mouse->id, 'quantity' => 3],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.customer_name', 'Budi Santoso')
            ->assertJsonPath('data.total_amount', 900000)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonCount(2, 'data.items');

        $this->assertSame(8, $earbuds->fresh()->stock);
        $this->assertSame(2, $mouse->fresh()->stock);
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_items', 2);
    }

    public function test_checkout_returns_409_when_stock_is_insufficient_and_rolls_back(): void
    {
        $category = Category::create(['name' => 'Olahraga', 'slug' => 'olahraga']);
        $matras = Product::create([
            'category_id' => $category->id,
            'name'        => 'Matras Yoga',
            'price'       => 119000,
            'stock'       => 10,
        ]);
        $dumbbell = Product::create([
            'category_id' => $category->id,
            'name'        => 'Dumbbell 3 kg',
            'price'       => 149000,
            'stock'       => 2,
        ]);

        $response = $this->postJson('/api/orders', [
            'customer_name'  => 'Siti',
            'customer_email' => 'siti@example.com',
            'items'          => [
                ['product_id' => $matras->id, 'quantity' => 1],
                ['product_id' => $dumbbell->id, 'quantity' => 5],
            ],
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('code', 'INSUFFICIENT_STOCK')
            ->assertJsonPath('errors.items.0.product_id', $dumbbell->id)
            ->assertJsonPath('errors.items.0.available', 2);

        // Pastikan stok kedua produk tidak berubah dan order tidak terbuat
        $this->assertSame(10, $matras->fresh()->stock);
        $this->assertSame(2, $dumbbell->fresh()->stock);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_validates_empty_and_duplicate_items(): void
    {
        $category = Category::create(['name' => 'Buku', 'slug' => 'buku']);
        $book = Product::create([
            'category_id' => $category->id,
            'name'        => 'Buku Catatan',
            'price'       => 45000,
            'stock'       => 10,
        ]);

        $this->postJson('/api/orders', [
            'customer_name'  => 'Andi',
            'customer_email' => 'andi@example.com',
            'items'          => [],
        ])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'VALIDATION_ERROR');

        $this->postJson('/api/orders', [
            'customer_name'  => 'Andi',
            'customer_email' => 'andi@example.com',
            'items'          => [
                ['product_id' => $book->id, 'quantity' => 1],
                ['product_id' => $book->id, 'quantity' => 2],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'VALIDATION_ERROR');
    }
}

<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        $admin = User::factory()->create([
            'email'    => 'admin@minishop.test',
            'password' => Hash::make('admin12345'),
        ]);
        $admin->is_admin = true;
        $admin->save();

        return $admin;
    }

    public function test_admin_can_login_check_me_and_logout(): void
    {
        $this->createAdmin();

        $login = $this->postJson('/api/auth/login', [
            'email'    => 'admin@minishop.test',
            'password' => 'admin12345',
        ]);

        $login->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token', 'user' => ['id', 'name', 'email']]]);

        $token = $login->json('data.token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'admin@minishop.test');

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_non_admin_user_cannot_login_or_access_admin_routes(): void
    {
        $user = User::factory()->create([
            'email'    => 'user@minishop.test',
            'password' => Hash::make('secret123'),
        ]);

        $this->postJson('/api/auth/login', [
            'email'    => 'user@minishop.test',
            'password' => 'secret123',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'INVALID_CREDENTIALS');

        Sanctum::actingAs($user);

        $this->getJson('/api/admin/orders')
            ->assertForbidden()
            ->assertJsonPath('code', 'FORBIDDEN');
    }

    public function test_admin_can_crud_products(): void
    {
        Sanctum::actingAs($this->createAdmin());
        $category = Category::create(['name' => 'Elektronik', 'slug' => 'elektronik']);

        // Create
        $create = $this->postJson('/api/admin/products', [
            'category_id' => $category->id,
            'name'        => 'Webcam HD',
            'description' => 'Webcam 1080p',
            'price'       => 250000,
            'image_url'   => 'https://picsum.photos/seed/webcam/600/600',
            'stock'       => 12,
        ]);

        $create->assertCreated()
            ->assertJsonPath('data.name', 'Webcam HD')
            ->assertJsonPath('data.category.slug', 'elektronik');

        $productId = $create->json('data.id');

        // Partial update via PATCH
        $this->patchJson("/api/admin/products/{$productId}", [
            'price' => 275000,
            'stock' => 20,
        ])
            ->assertOk()
            ->assertJsonPath('data.price', 275000)
            ->assertJsonPath('data.stock', 20);

        // Delete
        $this->deleteJson("/api/admin/products/{$productId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('products', ['id' => $productId]);
    }

    public function test_admin_can_list_and_view_order_detail(): void
    {
        Sanctum::actingAs($this->createAdmin());

        $category = Category::create(['name' => 'Buku', 'slug' => 'buku']);
        $product = Product::create([
            'category_id' => $category->id,
            'name'        => 'Buku Catatan',
            'price'       => 50000,
            'stock'       => 10,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-20261121-ABC123',
            'customer_name'  => 'Rina',
            'customer_email' => 'rina@example.com',
            'total_amount'   => 100000,
            'status'         => 'pending',
        ]);

        $order->items()->create([
            'product_id'   => $product->id,
            'product_name' => $product->name,
            'unit_price'   => 50000,
            'quantity'     => 2,
            'subtotal'     => 100000,
        ]);

        $this->getJson('/api/admin/orders')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.items_count', 1);

        $this->getJson("/api/admin/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.order_number', 'ORD-20261121-ABC123')
            ->assertJsonCount(1, 'data.items');
    }

    public function test_admin_can_update_order_status_and_cancel_restores_stock(): void
    {
        Sanctum::actingAs($this->createAdmin());

        $category = Category::create(['name' => 'Elektronik', 'slug' => 'elektronik']);
        $product = Product::create([
            'category_id' => $category->id,
            'name'        => 'Mouse Wireless',
            'price'       => 129000,
            'stock'       => 8,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-20261121-XYZ999',
            'customer_name'  => 'Dina',
            'customer_email' => 'dina@example.com',
            'total_amount'   => 258000,
            'status'         => 'pending',
        ]);

        $order->items()->create([
            'product_id'   => $product->id,
            'product_name' => $product->name,
            'unit_price'   => 129000,
            'quantity'     => 2,
            'subtotal'     => 258000,
        ]);

        // Update pending -> processing
        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'processing'])
            ->assertOk()
            ->assertJsonPath('data.status', 'processing');

        // Filter orders by status
        $this->getJson('/api/admin/orders?status=processing')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Invalid status rejected
        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'invalid'])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'VALIDATION_ERROR');

        // Cancel order restores stock (8 + 2 = 10)
        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertSame(10, $product->fresh()->stock);

        // Cancelled order cannot be reverted
        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed'])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'VALIDATION_ERROR');
    }

    public function test_api_returns_401_and_405_in_standard_error_format(): void
    {
        $this->getJson('/api/admin/orders')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'UNAUTHENTICATED');

        // Verifikasi HttpExceptionInterface (405) tidak berubah menjadi 500
        $this->deleteJson('/api/categories')
            ->assertStatus(405)
            ->assertJsonPath('success', false)
            ->assertJsonPath('code', 'METHOD_NOT_ALLOWED');
    }
}

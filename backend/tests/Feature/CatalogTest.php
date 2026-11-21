<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_ping_endpoint_returns_ok(): void
    {
        $this->getJson('/api/ping')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.app', 'MiniShop');
    }

    public function test_can_list_categories_ordered_by_name(): void
    {
        Category::create(['name' => 'Olahraga', 'slug' => 'olahraga']);
        Category::create(['name' => 'Buku', 'slug' => 'buku']);

        $response = $this->getJson('/api/categories');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.slug', 'buku')
            ->assertJsonPath('data.1.slug', 'olahraga');
    }

    public function test_can_list_search_and_filter_products(): void
    {
        $elektronik = Category::create(['name' => 'Elektronik', 'slug' => 'elektronik']);
        $fashion = Category::create(['name' => 'Fashion', 'slug' => 'fashion']);

        Product::create([
            'category_id' => $elektronik->id,
            'name'        => 'Mouse Wireless Silent',
            'description' => 'Mouse senyap',
            'price'       => 129000,
            'stock'       => 10,
        ]);

        Product::create([
            'category_id' => $fashion->id,
            'name'        => 'Jaket Hoodie Fleece',
            'description' => 'Hoodie tebal',
            'price'       => 219000,
            'stock'       => 5,
        ]);

        // List semua produk + pagination meta
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);

        // Search berdasarkan nama (case-insensitive)
        $this->getJson('/api/products?search=mouse')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Mouse Wireless Silent');

        // Filter berdasarkan slug kategori
        $this->getJson('/api/products?category=fashion')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category.slug', 'fashion');
    }

    public function test_can_view_product_detail_and_returns_404_when_missing(): void
    {
        $category = Category::create(['name' => 'Elektronik', 'slug' => 'elektronik']);
        $product = Product::create([
            'category_id' => $category->id,
            'name'        => 'Keyboard Mekanikal',
            'description' => 'Keyboard 75%',
            'price'       => 459000,
            'stock'       => 15,
        ]);

        $this->getJson("/api/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $product->id)
            ->assertJsonPath('data.category.slug', 'elektronik');

        $this->getJson('/api/products/999999')
            ->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('code', 'NOT_FOUND');
    }
}

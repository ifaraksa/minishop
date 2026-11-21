<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Support\ApiResponse;

class ProductController extends Controller
{
    public function store(ProductRequest $request)
    {
        $product = Product::create($request->validated())->load('category');

        return ApiResponse::success((new ProductResource($product))->resolve(), 'Produk dibuat', 201);
    }

    public function update(ProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        return ApiResponse::success((new ProductResource($product->load('category')))->resolve(), 'Produk diperbarui');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return ApiResponse::success(null, 'Produk dihapus');
    }
}
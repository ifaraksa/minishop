<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductIndexRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Support\ApiResponse;

class ProductController extends Controller
{
    public function index(ProductIndexRequest $request)
    {
        $filters = $request->validated();

        $products = Product::query()
            ->with('category')
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->whereLike('name', "%{$search}%"))
            ->when($filters['category'] ?? null, fn ($q, $slug) => $q->whereHas('category', fn ($c) => $c->where('slug', $slug)))
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 12);

        return ApiResponse::paginated(
            $products,
            ProductResource::collection($products->getCollection())->resolve(),
        );
    }

    public function show(Product $product)
    {
        $product->load('category');

        return ApiResponse::success((new ProductResource($product))->resolve());
    }
}
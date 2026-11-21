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

        return ApiResponse::success(
            ProductResource::collection($products->getCollection())->resolve(),
            'OK',
            200,
            [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
            ],
        );
    }

    public function show(Product $product)
    {
        $product->load('category');

        return ApiResponse::success((new ProductResource($product))->resolve());
    }
}
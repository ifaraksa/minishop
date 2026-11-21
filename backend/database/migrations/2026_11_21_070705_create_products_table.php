<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('price');
            $table->string('image_url', 500)->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->timestamps();
        });

        // Jaring pengaman terakhir: database menolak stok negatif (SQLite tidak mendukung ALTER TABLE ADD CONSTRAINT)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE products ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
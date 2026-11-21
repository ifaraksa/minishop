<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // [nama, deskripsi, harga (rupiah), stok]
        $catalog = [
            'elektronik' => [
                ['Earbuds Nirkabel Bass Pro', 'Earbuds Bluetooth dengan bass kuat dan baterai tahan seharian.', 349000, 25],
                ['Powerbank 10.000 mAh', 'Powerbank ringkas dengan dua port keluaran dan pengisian cepat.', 189000, 40],
                ['Keyboard Mekanikal Compact', 'Keyboard 75% dengan switch taktil dan lampu latar.', 459000, 15],
                ['Mouse Wireless Silent', 'Mouse nirkabel klik senyap, nyaman untuk kerja lama.', 129000, 30],
            ],
            'fashion' => [
                ['Kaos Polos Cotton Combed', 'Kaos katun adem dan lembut, tersedia banyak warna.', 79000, 60],
                ['Jaket Hoodie Fleece', 'Hoodie tebal dan hangat dengan kantong depan.', 219000, 20],
                ['Tas Ransel Anti Air', 'Ransel muat laptop 14 inci dengan bahan tahan air.', 259000, 12],
            ],
            'rumah-tangga' => [
                ['Botol Minum Stainless 500 ml', 'Botol tahan panas dan dingin hingga 12 jam.', 89000, 50],
                ['Lampu Meja LED Fleksibel', 'Lampu belajar dengan tiga tingkat kecerahan.', 99000, 0],
            ],
            'buku' => [
                ['Buku Catatan Hardcover A5', 'Buku catatan sampul keras, 200 halaman bergaris.', 45000, 80],
            ],
            'olahraga' => [
                ['Matras Yoga 6 mm', 'Matras anti selip, empuk, dan mudah digulung.', 119000, 22],
                ['Dumbbell Vinyl 3 kg (Sepasang)', 'Dumbbell berlapis vinyl untuk latihan di rumah.', 149000, 3],
            ],
        ];

        foreach ($catalog as $categorySlug => $items) {
            $categoryId = Category::where('slug', $categorySlug)->value('id');

            foreach ($items as [$name, $description, $price, $stock]) {
                $product = Product::firstOrNew(['name' => $name]);

                $product->fill([
                    'category_id' => $categoryId,
                    'description' => $description,
                    'price'       => $price,
                    'image_url'   => 'https://picsum.photos/seed/' . Str::slug($name) . '/600/600',
                ]);

                if (! $product->exists) {
                    $product->stock = $stock;
                }

                $product->save();
            }
        }
    }
}
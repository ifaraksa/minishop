# AI Usage Documentation

Dokumen ini mendokumentasikan pemanfaatan *AI coding assistant* selama pengembangan studi kasus **MiniShop — Product Catalog & Cart** secara transparan, termasuk cakupan penggunaan, contoh prompt pada bagian krusial, keputusan teknis yang diambil, serta verifikasi manual yang dilakukan.

---

## 1. Tools AI yang Digunakan

| Tool | Peran & Cakupan Penggunaan |
|---|---|
| **Antigravity (Google DeepMind AI Coding Assistant)** | Audit arsitektur backend, perbaikan *exception handling*, penulisan *PHPUnit Feature Tests*, perancangan sistem desain dan implementasi frontend (React, TypeScript, Tailwind CSS, Framer Motion), serta penyusunan dokumentasi teknis. |
| **Antigravity Image Generator** | Pembuatan 12 aset foto produk bergaya studio minimalis (`backend/public/images/products/*.jpg`) agar gambar katalog sesuai dengan masing-masing judul produk. |

---

## 2. Contoh Prompt pada Bagian Krusial

### A. Konsistensi Transaksi Checkout & Manajemen Status Order (Backend)

> **Prompt:**
> *"Audit implementasi backend Laravel untuk alur checkout dan manajemen order. Pastikan proses pengurangan stok berjalan atomik di dalam database transaction dengan row-level locking (`lockForUpdate()` yang diurutkan berdasarkan `product_id` untuk mencegah deadlock), seluruh harga dihitung dari database, serta kembalikan error HTTP `409 INSUFFICIENT_STOCK` yang merinci item bermasalah jika stok tidak mencukupi. Tambahkan pula endpoint `PATCH /api/admin/orders/{order}/status` yang otomatis mengembalikan stok produk apabila pesanan dibatalkan (`cancelled`), lengkap dengan PHPUnit Feature Test."*

**Keputusan Teknis & Implementasi:**
- Memvalidasi dan menguji `CheckoutService::checkout()` agar seluruh pengecekan stok dilakukan sebelum operasi penulisan, menyimpan *snapshot* `product_name` dan `unit_price` pada `order_items`, lalu mengurangi stok secara atomik.
- Menambahkan `UpdateOrderStatusRequest` dan `Admin\OrderController::updateStatus()` dengan penguncian baris order + produk (`lockForUpdate()`) untuk mengembalikan stok secara aman saat status berubah menjadi `cancelled`, serta menolak perubahan ulang pada order yang sudah berstatus `cancelled` (`422`).
- Memperbaiki duplikasi handler `\Throwable` dan *missing import* `HttpExceptionInterface` di `backend/bootstrap/app.php` agar status HTTP (`403`, `404`, `405`, `429`) tidak tertimpa menjadi `500 SERVER_ERROR`.
- Menyusun 3 suite Feature Test (`CatalogTest`, `CheckoutTest`, `AdminApiTest`) mencakup **13 skenario uji (92 assertions)** yang berjalan di atas SQLite in-memory.

### B. State Management Cart Client-Side, Persistensi, & Validasi Stok (Frontend)

> **Prompt:**
> *"Implementasikan `CartContext` berbasis React Context + TypeScript yang tersimpan otomatis di `localStorage` agar tidak hilang saat refresh. Pastikan setiap aksi tambah dan ubah quantity tervalidasi terhadap stok produk terbaru dari API, sinkronkan otomatis ketika katalog dimuat ulang, serta tangani respons `409 INSUFFICIENT_STOCK` saat checkout dengan opsi penyesuaian jumlah keranjang otomatis."*

**Keputusan Teknis & Implementasi:**
- Mengimplementasikan `CartContext` (`frontend/src/context/CartContext.tsx`) dengan *parsing* `localStorage` yang defensif, perhitungan subtotal & total otomatis, pembatasan `quantity <= product.stock`, dan `syncCatalogProducts()` untuk mencegah data stok kedaluwarsa.
- Menambahkan penanganan khusus `409 INSUFFICIENT_STOCK` di `CheckoutModal.tsx` yang menampilkan daftar produk dengan selisih stok beserta tombol **Sesuaikan Stok Otomatis**.

### C. Sistem Desain Editorial & Pengalaman Interaksi (Frontend UI/UX)

> **Prompt:**
> *"Rancang antarmuka storefront bergaya editorial minimalis yang nyaman di mata dengan palet Warm Editorial Stone (`#F5F3EE`, `#1A1A18`, `#63625C`) dan aksen konfirmasi hijau redup (`#4A6B53`), tipografi Plus Jakarta Sans + JetBrains Mono, layout katalog asimetris (7:5 bergantian dengan 3 kolom) + mode Index dengan pratinjau foto saat hover, halaman detail produk khusus (`/products/:id`) dengan transisi mulus tanpa kedip skeleton dan efek optical scroll-blur, serta Admin Backoffice yang terpisah secara fungsional untuk pengelolaan inventaris dan alur status pesanan."*

**Keputusan Teknis & Implementasi:**
- Mengintegrasikan **Framer Motion** (`layoutId` pada filter kategori & tab status, `AnimatePresence`, `whileInView`, `<MotionConfig reducedMotion="user">`) dengan kurva easing `cubic-bezier(0.16, 1, 0.3, 1)`.
- Meneruskan snapshot produk melalui React Router `state` agar navigasi ke `/products/:id` langsung merender konten tanpa kedip skeleton sementara data stok terbaru dimuat di latar belakang.

---

## 3. Kepemilikan Kode & Verifikasi Manual

Seluruh keluaran AI ditinjau, disesuaikan dengan arsitektur proyek, dan diverifikasi secara langsung sebelum dikirim:

1. **Automated Backend Tests:** Menjalankan `php vendor/phpunit/phpunit/phpunit` — seluruh **13/13 tests (92 assertions)** lulus.
2. **Static Type-Check & Production Build:** Menjalankan `npm run build` (`tsc -b && vite build`) — lulus dengan **0 error**.
3. **End-to-End Manual Testing di Browser Lokal:** Menguji langsung seluruh alur di `http://localhost:5173` dan `http://localhost:8000`: pencarian produk, filter kategori, mode Galeri & Index, detail produk, persistensi cart setelah refresh, validasi batas stok, checkout + pengurangan stok, login admin, CRUD produk, perubahan status order, serta pembatalan order dengan verifikasi pengembalian stok.

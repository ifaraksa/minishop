# AI Usage Documentation

Dokumen ini menjelaskan penggunaan AI coding assistant selama pengerjaan case study **MiniShop**.

---

## 1. Tools AI yang Dipakai

- **Antigravity (Google DeepMind AI Coding Assistant)** — digunakan untuk review struktur backend, perbaikan bug & penulisan PHPUnit Feature Tests, perancangan serta implementasi antarmuka frontend (React + TypeScript + Tailwind CSS), pembuatan 12 foto dummy produk bergaya studio MUJI (`backend/public/images/products/`), hingga penyusunan dokumentasi proyek.

---

## 2. Contoh Prompt untuk Bagian Krusial

### A. Review Arsitektur Backend, Exception Handling, dan Feature Tests

> **Prompt:**
> *"Aku baru selesai backend-nya. Menurutmu struktur folder dan file-nya sudah bagus atau ada kekurangan terhadap case study MiniShop ini? Kalau ada bug atau kekurangan, tolong bereskan perbaikan backend dan buatkan Feature Test singkat untuk alur katalog, checkout (termasuk validasi stok kurang 409), dan admin CRUD."*

**Hasil & Keputusan Teknis yang Diambil:**
- Menemukan dan memperbaiki duplikasi handler `\Throwable` serta *missing import* `HttpExceptionInterface` di `backend/bootstrap/app.php` yang sebelumnya berisiko mengubah error HTTP (`403`/`405`/`429`) menjadi `500 SERVER_ERROR`.
- Memastikan kompatibilitas migrasi `CHECK (stock >= 0)` antara PostgreSQL dan SQLite in-memory untuk testing, serta menyamakan panjang kolom `image_url` (`500` karakter) dengan validasi `ProductRequest`.
- Menambahkan 3 suite Feature Test (`CatalogTest`, `CheckoutTest`, `AdminApiTest`) dengan total **13 test (92 assertions)** yang semuanya lulus via PHPUnit.

### B. Validasi Stok & Konsistensi Transaksi saat Checkout (`CheckoutService`)

> **Konsep / Prompt yang Diterapkan:**
> *"Pastikan proses checkout di backend menggunakan database transaction dengan `lockForUpdate()` yang diurutkan berdasarkan `product_id` untuk mencegah deadlock dan race condition saat stok berkurang. Hitung seluruh subtotal dan total langsung dari harga di database (bukan dari payload client), dan lempar custom exception `InsufficientStockException` (HTTP 409) berisi rincian item yang stoknya kurang sebelum mengubah stok apa pun."*

**Hasil & Keputusan Teknis yang Diambil:**
- `CheckoutService::checkout()` mengunci baris produk (`lockForUpdate()`), memverifikasi stok seluruh item sebelum menulis data, menyimpan snapshot `product_name` & `unit_price` di `order_items`, lalu mengurangi stok secara atomik di dalam satu transaksi database.
- Di sisi frontend (`CheckoutModal.tsx`), respons `409 INSUFFICIENT_STOCK` di-parse dan ditampilkan secara spesifik per produk lengkap dengan tombol **"Sesuaikan Stok Otomatis"** yang langsung menyelaraskan keranjang dengan stok terbaru.

### C. Perancangan UI/UX Frontend Murni (Non-Template) & Persistensi Cart

> **Prompt:**
> *"Desain awal terasa seperti template. Tolong buat ulang desain yang murni terinspirasi MUJI: warna yang tidak bikin sakit mata dengan ciri khas hijau yang tidak terlalu gelap/terang, frameless gallery langsung masuk ke katalog (shop-first), halaman detail produk terpisah agar fokus, filter kategori di sidebar, animasi/transisi yang lebih smooth, dan halaman admin yang fokus operasional bukan seperti toko."*

**Hasil & Keputusan Teknis yang Diambil:**
- Menerapkan bahasa desain editorial *Warm Editorial Stone* (`#F5F3EE` + `#1A1A18` monochrome + aksen tipis `#4A6B53` pada sinyal konfirmasi, tipografi **Plus Jakarta Sans** + **JetBrains Mono**) dengan ritme baris bergantian **Asimetris 7:5** dan **3-Kolom** yang dipisahkan garis *hairline*, plus mode **Index Ledger** interaktif (*live hover preview*).
- Menggunakan **Framer Motion** (`layoutId` pada filter kategori, `AnimatePresence`, `whileInView`, easing `cubic-bezier(0.16, 1, 0.3, 1)`, dan `<MotionConfig reducedMotion="user">`) serta ikon `lucide-react` `strokeWidth={1.25}`.
- Merancang halaman detail produk khusus (`/products/:id`) bergaya *split monograph* dengan efek *progressive optical scroll-blur* (`requestAnimationFrame`) dan *frosted-glass floating quick-buy bar*, serta **Admin Backoffice** terpisah dengan konsol operasional dan *Order Inspector Drawer*.
- Mengimplementasikan smooth wheel inertia (`useSmoothScroll`), *keep-previous-data* agar filter/pencarian tidak berkedip skeleton, serta `CartContext` yang otomatis tersimpan ke `localStorage` dan menyinkronkan stok terbaru.

---

## 3. Verifikasi Manual

Seluruh kode yang dibantu AI telah diperiksa dan diverifikasi secara langsung:
- Menjalankan backend test suite (`php vendor/phpunit/phpunit/phpunit` — **13/13 passed, 92 assertions**).
- Menjalankan TypeScript type-check & production build frontend (`npm run build` — **0 errors**).
- Menguji langsung seluruh alur di browser lokal (`http://localhost:5173` & `http://localhost:8000`): pencarian, filter kategori, detail produk, keranjang persisten setelah refresh, checkout + pengurangan stok, login admin, CRUD produk, dan inspeksi detail order.

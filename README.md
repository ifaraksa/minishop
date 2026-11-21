# MiniShop — Product Catalog & Cart

Aplikasi web e-commerce (**Product Catalog, Client-Side Cart, Checkout, dan Admin Backoffice**) yang dibangun menggunakan **Laravel REST API** dan **React + TypeScript**.

---

## 1. Overview Aplikasi

MiniShop memisahkan pengalaman pelanggan dan operator ke dalam dua area utama:

- **Storefront Pelanggan (`/` & `/products/:id`)**
  - Katalog produk langsung (*shop-first*) dengan tampilan **Galeri Asimetris** (ritme bergantian 2-kolom `7:5` dan 3-kolom `4:5`) serta mode **Index Ledger** interaktif dengan pratinjau foto saat *hover*.
  - Pencarian produk berdasarkan nama (*debounced* + shortcut `/`), filter kategori (*animated active indicator*), dan filter ketersediaan stok.
  - Halaman detail produk khusus (`/products/:id`) dengan transisi halus tanpa kedip *skeleton*, efek *optical scroll-blur*, deskripsi lengkap, indikator stok, pemilih jumlah, dan rekomendasi produk satu kategori.
  - **Keranjang Belanja (Slide-Over Drawer)** yang tersimpan otomatis di `localStorage` (*persists across refresh*), kalkulasi subtotal & total otomatis, serta validasi jumlah agar tidak melebihi stok.
  - **Checkout tanpa payment gateway** dengan validasi dan pengurangan stok secara atomik di backend (termasuk penanganan `409 INSUFFICIENT_STOCK` dengan penyesuaian stok otomatis) serta slip konfirmasi **"Order Berhasil"**.
- **Admin Backoffice (`/admin` & `/admin/login`)**
  - Autentikasi admin menggunakan **Laravel Sanctum** (Bearer token) + middleware role `admin`.
  - **Inventaris Produk (Full CRUD):** tambah, edit (dengan *live preview* gambar URL), hapus produk, filter kategori, serta filter cepat stok menipis/habis.
  - **Manajemen Pesanan:** daftar order dengan filter status, **Order Detail Drawer** berisi rincian item, pembaruan siklus status (`Menunggu → Diproses → Dikirim → Selesai`), serta pembatalan pesanan (`Dibatalkan`) yang otomatis mengembalikan stok produk.

---

## 2. Tech Stack & Alasan Pemilihan

| Layer | Teknologi | Alasan Pemilihan |
|---|---|---|
| **Backend** | **Laravel 13** (PHP 8.3) + **Laravel Sanctum** | Ekosistem REST API yang matang (`FormRequest`, `JsonResource`, `DB::transaction`, `lockForUpdate()` untuk mencegah *race condition* stok, serta PHPUnit Feature Test bawaan). |
| **Database** | **PostgreSQL** (migrasi kompatibel dengan SQLite untuk automated test) | Andal untuk transaksi relasional, mendukung *row-level locking* (`SELECT ... FOR UPDATE`), `CHECK (stock >= 0)`, dan `nullOnDelete` agar histori order tetap utuh saat produk dihapus. |
| **Frontend** | **React 19 + Vite + TypeScript + Tailwind CSS v4 + Framer Motion + React Router + Lucide Icons** | Ringan, *type-safe* mengikuti kontrak JSON backend, responsif dari mobile hingga desktop lebar, dan transisi antarmuka berbasis *physics* yang halus. |
| **State Cart** | **React Context + `localStorage`** | Sesuai kebutuhan brief (*client-side* hingga checkout) tanpa overhead tabel cart di server, sekaligus memenuhi bonus persistensi saat halaman di-refresh. |

### Struktur Proyek

```text
minishop/
├── backend/                        # Laravel 13 REST API
│   ├── app/
│   │   ├── Exceptions/             # InsufficientStockException
│   │   ├── Http/
│   │   │   ├── Controllers/Api/    # Public & Admin controllers
│   │   │   ├── Middleware/EnsureAdmin.php
│   │   │   ├── Requests/           # FormRequest validations
│   │   │   └── Resources/          # JSON response transformers
│   │   ├── Models/                 # Category, Product, Order, OrderItem, User
│   │   ├── Services/               # CheckoutService (transaction & stock locking)
│   │   └── Support/                # ApiResponse helper
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/                # AdminSeeder, CategorySeeder, ProductSeeder (12 produk)
│   ├── docker/start.sh             # Startup script container (migrate, seed, Apache)
│   ├── public/images/products/     # 12 foto studio produk
│   ├── tests/Feature/              # CatalogTest, CheckoutTest, AdminApiTest
│   └── Dockerfile                  # Siap deploy ke Render / Railway
├── frontend/                       # React + Vite + TypeScript SPA
│   ├── public/_redirects           # SPA rewrite untuk Netlify
│   ├── src/
│   │   ├── api/                    # HTTP client & modular endpoints
│   │   ├── components/             # Storefront, Admin, dan UI primitives
│   │   ├── context/                # CartContext (localStorage), AuthContext, ToastContext
│   │   ├── hooks/                  # useSmoothScroll
│   │   ├── pages/                  # CatalogPage, ProductDetailPage, AdminLoginPage, AdminDashboardPage
│   │   ├── types/
│   │   └── utils/                  # format, motion, orderStatus
│   └── vercel.json                 # SPA rewrite untuk Vercel
├── README.md
└── AI_USAGE.md
```

---

## 3. Cara Menjalankan Project Secara Lokal

### Prasyarat

- PHP `>= 8.3` & Composer
- PostgreSQL (buat database kosong bernama `minishop`)
- Node.js `>= 18` & npm

### A. Menjalankan Backend (`http://localhost:8000`)

```bash
cd backend
composer install
cp .env.example .env
```

Sesuaikan kredensial PostgreSQL di `backend/.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=minishop
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

Generate application key, jalankan migrasi beserta seeder, lalu jalankan server:

```bash
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Seeder otomatis mengisi:
- **5 kategori** (`Elektronik`, `Fashion`, `Rumah Tangga`, `Buku`, `Olahraga`)
- **12 produk dummy** dengan foto studio lokal (termasuk *edge case* produk stok `0` dan stok tipis `3` untuk menguji validasi stok)
- **Akun Demo Admin:**
  - Email: `admin@minishop.test`
  - Password: `admin12345`

### B. Menjalankan Frontend (`http://localhost:5173`)

Buka terminal baru:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Akses aplikasi di browser:
- **Storefront:** `http://localhost:5173`
- **Admin Backoffice:** `http://localhost:5173/admin` *(tersedia tombol "Isi Otomatis" untuk akun demo di halaman login)*

### C. Menjalankan Automated Test & Build Check

```bash
# Backend Feature Tests (13 tests, 92 assertions — SQLite in-memory)
cd backend
php artisan test

# Frontend TypeScript & Production Build check
cd frontend
npm run build
```

---

## 4. Daftar Endpoint API

Base URL lokal: `http://localhost:8000/api`

Seluruh respons memakai format konsisten dari `ApiResponse`:
- **Sukses:** `{ "success": true, "message": "...", "data": ..., "meta": {} }`
- **Error:** `{ "success": false, "message": "...", "code": "ERROR_CODE", "errors": {} }`

### Ringkasan Endpoint

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/ping` | Public | Health check API |
| `GET` | `/api/categories` | Public | Daftar kategori diurutkan berdasarkan nama |
| `GET` | `/api/products` | Public | Daftar produk + paginasi (`?search=&category=&page=&per_page=`) |
| `GET` | `/api/products/{id}` | Public | Detail satu produk beserta kategorinya |
| `POST` | `/api/orders` | Public | Checkout keranjang, buat order, dan kurangi stok secara atomik |
| `POST` | `/api/auth/login` | Public | Login admin (mengembalikan Sanctum Bearer token) |
| `GET` | `/api/auth/me` | Bearer | Profil admin yang sedang login |
| `POST` | `/api/auth/logout` | Bearer | Hapus token sesi admin saat ini |
| `POST` | `/api/admin/products` | Bearer + Admin | Tambah produk baru |
| `PUT` / `PATCH` | `/api/admin/products/{id}` | Bearer + Admin | Perbarui data produk |
| `DELETE` | `/api/admin/products/{id}` | Bearer + Admin | Hapus produk |
| `GET` | `/api/admin/orders` | Bearer + Admin | Daftar order masuk (terbaru lebih dulu, mendukung `?status=`) |
| `GET` | `/api/admin/orders/{id}` | Bearer + Admin | Detail satu order beserta seluruh item pembelian |
| `PATCH` | `/api/admin/orders/{id}/status` | Bearer + Admin | Ubah status order (`pending`, `processing`, `shipped`, `completed`, `cancelled` + auto-kembalikan stok) |

### Contoh Request & Response Singkat

#### `GET /api/products?search=mouse&category=elektronik`

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 4,
      "name": "Mouse Wireless Silent",
      "description": "Mouse nirkabel klik senyap, nyaman untuk kerja lama.",
      "price": 129000,
      "image_url": "http://localhost:8000/images/products/mouse-wireless-silent.jpg",
      "stock": 30,
      "category": { "id": 1, "name": "Elektronik", "slug": "elektronik" }
    }
  ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 12, "total": 1 }
}
```

#### `POST /api/orders`

Request:
```json
{
  "customer_name": "Budi Santoso",
  "customer_email": "budi@example.com",
  "customer_phone": "081234567890",
  "items": [
    { "product_id": 1, "quantity": 2 }
  ]
}
```

Response (`201 Created`):
```json
{
  "success": true,
  "message": "Order berhasil dibuat",
  "data": {
    "id": 1,
    "order_number": "ORD-20261121-AB12CD",
    "customer_name": "Budi Santoso",
    "customer_email": "budi@example.com",
    "customer_phone": "081234567890",
    "total_amount": 698000,
    "status": "pending",
    "created_at": "2026-11-21T09:30:00+00:00",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Earbuds Nirkabel Bass Pro",
        "unit_price": 349000,
        "quantity": 2,
        "subtotal": 698000
      }
    ]
  },
  "meta": {}
}
```

Response bila stok tidak mencukupi (`409 Conflict`):
```json
{
  "success": false,
  "message": "Stok tidak mencukupi",
  "code": "INSUFFICIENT_STOCK",
  "errors": {
    "items": [
      { "product_id": 12, "name": "Dumbbell Vinyl 3 kg (Sepasang)", "requested": 5, "available": 3 }
    ]
  }
}
```

#### `PATCH /api/admin/orders/{id}/status`

Request (`Authorization: Bearer <token>`):
```json
{
  "status": "processing"
}
```

Response (`200 OK`):
```json
{
  "success": true,
  "message": "Status order diperbarui",
  "data": {
    "id": 1,
    "order_number": "ORD-20261121-AB12CD",
    "status": "processing",
    "total_amount": 698000,
    "items_count": 1
  },
  "meta": {}
}
```

#### `POST /api/auth/login`

Request:
```json
{
  "email": "admin@minishop.test",
  "password": "admin12345"
}
```

Response (`200 OK`):
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "1|xxxxxxxxxxxxxxxxxxxx",
    "user": { "id": 1, "name": "Admin MiniShop", "email": "admin@minishop.test" }
  },
  "meta": {}
}
```

---

## 5. Known Limitations

- **Tanpa Payment Gateway:** Checkout langsung mencatat order dengan status awal `pending` sesuai ruang lingkup case study, lalu status dapat diproses atau dibatalkan melalui Admin Backoffice.
- **Gambar Produk Menggunakan URL:** Form produk di admin menerima input URL gambar (`image_url`), belum mendukung upload file gambar langsung ke local storage maupun object storage (S3/R2).
- **Kategori Belum CRUD di Admin UI:** Daftar kategori dikelola melalui seeder (`CategorySeeder`) dan belum memiliki halaman manajemen terpisah di admin.
- **Guest Checkout:** Autentikasi hanya diterapkan pada Admin Backoffice; pelanggan dapat langsung berbelanja dan checkout tanpa registrasi akun.
- **Konfigurasi Deployment:** `backend/Dockerfile` (Render/Railway) serta `frontend/vercel.json` & `frontend/public/_redirects` (Vercel/Netlify) telah disediakan; tautan live demo dapat ditambahkan setelah proses deployment selesai.

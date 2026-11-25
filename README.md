# Titik Temu Kopi — Sistem Kasir & Pemesanan Kafe (POS)

Aplikasi web Point of Sales untuk Dine-In & Takeaway: login per role, dashboard eksekutif,
transaksi master-detail dengan kalkulasi otomatis, cetak struk, serta laporan dengan ekspor PDF/Excel/CSV.

> Studi kasus: **MED-WEB-01 — Sistem Kasir & Pemesanan Kafe Modern**

## Tech Stack

| Lapisan  | Teknologi |
|----------|-----------|
| Backend  | PHP 8.2, **Laravel 12** (REST API), Laravel Sanctum (token auth) |
| Database | **MySQL 8** (InnoDB, transaksi ACID) |
| Frontend | **React 19** + Vite 6, React Router 6, Axios, Chart.js (react-chartjs-2), react-hot-toast |
| Ekspor   | barryvdh/laravel-dompdf (PDF), phpoffice/phpspreadsheet (Excel .xlsx), CSV native |

## Struktur Folder

```
.
├── backend/                     # Laravel API
│   ├── app/Http/Controllers/    # Auth, Dashboard, Order, Report, Category, Product, Voucher, User
│   ├── app/Http/Middleware/     # EnsureRole (pembatasan role admin/kasir)
│   ├── app/Http/Requests/       # StoreOrderRequest (validasi form transaksi)
│   ├── app/Models/              # User, Category, Product, Voucher, Order, OrderDetail
│   ├── app/Services/            # OrderService (transaksi, stok, invoice), ReportService
│   ├── database/migrations/     # skema tabel
│   ├── database/seeders/        # akun demo, menu, voucher, riwayat transaksi 14 hari
│   ├── resources/views/reports/ # template PDF laporan
│   ├── routes/api.php           # seluruh endpoint API
│   └── tests/Feature/           # pengujian alur transaksi & keamanan
├── frontend/                    # React SPA
│   └── src/
│       ├── components/          # Layout, ProtectedRoute, Modal, CrudPage, dll.
│       ├── context/             # AuthContext (sesi login)
│       ├── lib/                 # api client (axios), helper format
│       └── pages/               # Login, Dashboard, POS, Riwayat, Struk, Laporan, Master data
└── database.sql                 # dump database lengkap dengan data demo
```

## Instalasi

### Prasyarat
PHP ≥ 8.2 (ekstensi `pdo_mysql`, `mbstring`, `gd`, `zip`, `dom`), Composer, Node.js ≥ 18, MySQL/MariaDB.
(Laragon/XAMPP sudah mencakup semuanya.)

### 1. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env          # Windows: copy .env.example .env
php artisan key:generate
```

Buat database lalu sesuaikan kredensial di `.env` (default: `pos_kafe`, user `root`, tanpa password):

```sql
CREATE DATABASE pos_kafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Isi tabel & data demo — pilih **salah satu**:

```bash
php artisan migrate --seed            # opsi A: migration + seeder (data transaksi dibuat relatif terhadap hari ini)
mysql -u root < ../database.sql       # opsi B: impor dump SQL
```

Jalankan server API:

```bash
php artisan serve                      # http://127.0.0.1:8000
```

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev                            # http://localhost:5173
```

Vite meneruskan request `/api/*` ke `http://127.0.0.1:8000` (lihat `vite.config.js`), jadi tidak perlu
konfigurasi CORS saat development. Jika port 5173 sedang dipakai, Vite otomatis memakai port berikutnya
(mis. 5174) — lihat URL yang tampil di terminal.

Untuk build produksi: `npm run build` (hasil di `frontend/dist`). Bila API berada di domain lain, set
`VITE_API_URL=https://domain-api/api` sebelum build.

### 3. Menjalankan test (opsional)

```bash
mysql -u root -e "CREATE DATABASE pos_kafe_test"
cd backend && php artisan test
```

## Akun Uji Coba

| Role | Username | Email | Password |
|------|----------|-------|----------|
| Administrator / Manager | `admin`  | admin@titiktemu.test  | `admin123` |
| Kasir / Waiter          | `kasir`  | kasir@titiktemu.test  | `kasir123` |
| Kasir / Waiter          | `kasir2` | kasir2@titiktemu.test | `kasir123` |

Login dapat memakai username **atau** email.

Voucher demo: `HEMAT10` (10%, min. belanja Rp50.000, maks. Rp20.000), `NGOPI5K` (potongan Rp5.000, min. Rp30.000).
`MERDEKA17` sengaja dinonaktifkan untuk menguji penolakan voucher.

## Pemenuhan 4 Modul Wajib

### 01 — Autentikasi & Hak Akses
- Form login dengan validasi klien & server; pesan berbeda untuk username/email tidak terdaftar, password salah, dan akun nonaktif.
- Password di-hash **bcrypt** (cast `hashed` pada model `User`), tidak ada plaintext.
- Route API dilindungi `auth:sanctum`; fitur admin dilindungi middleware `role:admin`. Di frontend, `ProtectedRoute` mencegah akses halaman tanpa login atau tanpa role yang sesuai.
- Logout menghapus token di server (`currentAccessToken()->delete()`) lalu membersihkan sesi di browser dan kembali ke halaman login. Token kedaluwarsa setelah 12 jam; respons 401 otomatis mengarahkan ke login.
- Endpoint login dibatasi 10 percobaan/menit (throttle).
- **Admin**: dashboard, master menu & kategori, stok & harga, voucher, pengguna, laporan + ekspor, seluruh transaksi.
- **Kasir**: dashboard (data miliknya), transaksi baru, terima pembayaran, cetak struk, riwayat transaksinya sendiri.

### 02 — Dashboard Eksekutif
- 4 KPI: Total Omset Hari Ini, Jumlah Pesanan (lunas hari ini), Menu Terlaris, Peringatan Stok Rendah.
- Grafik batang tren omset 7 hari + diagram donat distribusi kategori (Chart.js).
- Tabel 10 transaksi terbaru beserta status, daftar item stok rendah.
- Tombol aksi cepat **Transaksi Baru**.

### 03 — Transaksi Inti (Master-Detail)
- Nomor faktur otomatis `INV-POS-YYYYMMDD-XXXX` — pratinjau saat form dibuka, nomor final dikunci (`SELECT … FOR UPDATE`) saat disimpan; kolom `invoice_number` UNIQUE.
- Tipe pesanan Dine-In (wajib No. Meja) / Takeaway, nama pemesan / catatan meja.
- Baris item dinamis: pilih menu (grid atau dropdown), qty, catatan khusus (Less Sugar, Extra Ice, …).
- Kalkulasi otomatis: subtotal per baris, diskon voucher, pajak PB1 10% (dari subtotal setelah diskon), grand total. Backend menghitung ulang semuanya — angka dari klien tidak dipercaya.
- Pembayaran Tunai (hitung kembalian + tombol nominal cepat), QRIS, Transfer Bank, Kartu Debit.
- Status: Diproses → Selesai / Dibatalkan (pembatalan mengembalikan stok; status final tidak bisa diubah lagi).
- Validasi & integritas:
  - stok dicek dengan penguncian baris produk sebelum disimpan (qty produk yang sama di beberapa baris dijumlahkan);
  - pembayaran tunai kurang dari tagihan ditolak (klien & server);
  - `DB::transaction` membungkus header, detail, dan pengurangan stok — gagal di satu langkah = rollback semua.
- Struk siap cetak dengan pilihan ukuran **thermal 58mm / 80mm / A4**.

### 04 — Laporan & Ekspor
- Filter: rentang tanggal, kategori menu (Coffee, Non-Coffee, Food, Pastry), metode pembayaran, status.
- Summary bar: Omset Bruto, Total Diskon, Total Pajak, Omset Bersih, Rata-rata Nilai Transaksi (AOV), plus Laba Kotor (omset bersih − HPP).
- Tabel: No. Faktur, Tanggal & Jam, Kasir, Tipe Pesanan, Item Terjual, Subtotal, Pajak, Grand Total, Status.
- Ekspor **PDF** (A4 landscape), **Excel (.xlsx)**, dan **CSV**.

Definisi angka: transaksi *lunas* = semua transaksi yang tidak dibatalkan (pembayaran diterima saat
transaksi dibuat). Omset bersih = omset bruto − diskon; pajak PB1 tidak dihitung sebagai pendapatan.

## Skema Database

| Tabel | Kolom utama |
|-------|-------------|
| `users` | id, username, nama_lengkap, email, password (bcrypt), role [admin/kasir], status, created_at |
| `categories` | id, nama_kategori, slug, status |
| `products` | id, category_id, kode_produk, nama_produk, harga_jual, harga_pokok, stok, stok_minimum, unit, status, created_at |
| `vouchers` | id, kode, nama, tipe [persen/nominal], nilai, min_belanja, maks_diskon, status |
| `orders` | id, invoice_number (unique), user_id, tipe_pesanan, nomor_meja, nama_pemesan, total_subtotal, voucher_code, diskon_nominal, pajak_nominal, grand_total, metode_bayar, uang_dibayar, uang_kembali, status, created_at |
| `order_details` | id, order_id, product_id, nama_produk, harga_satuan, harga_pokok, kuantiti, subtotal_baris, catatan_khusus |

`order_details` menyimpan salinan nama, harga jual, dan harga pokok saat transaksi, sehingga riwayat dan
laporan tidak berubah ketika master menu diedit. Menu/pengguna yang sudah punya transaksi tidak dihapus,
melainkan dinonaktifkan.

## Ringkasan Endpoint API

| Method | Endpoint | Akses |
|--------|----------|-------|
| POST | `/api/login`, `/api/logout` · GET `/api/me` | publik / login |
| GET | `/api/dashboard` | semua role |
| GET | `/api/products`, `/api/categories` | semua role |
| POST | `/api/vouchers/check` | semua role |
| GET/POST | `/api/orders` · GET `/api/orders/next-invoice` · GET `/api/orders/{id}` · PATCH `/api/orders/{id}/status` | semua role (kasir hanya miliknya) |
| POST/PUT/DELETE | `/api/categories`, `/api/products` | admin |
| CRUD | `/api/vouchers`, `/api/users` | admin |
| GET | `/api/reports`, `/api/reports/export?format=pdf\|xlsx\|csv` | admin |

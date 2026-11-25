<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Simpan transaksi (header + detail) dalam satu database transaction.
     * Jika salah satu langkah gagal (stok kurang, pembayaran kurang, dsb.) seluruh perubahan di-rollback.
     */
    public function create(User $cashier, array $data): Order
    {
        // attempts = 3: transaksi diulang otomatis bila terjadi deadlock saat dua kasir menyimpan bersamaan
        return DB::transaction(function () use ($cashier, $data) {
            $requestedQty = collect($data['items'])
                ->groupBy('product_id')
                ->map(fn ($rows) => $rows->sum('qty'));

            // Kunci baris produk agar stok tidak dibaca ganda oleh transaksi lain
            $products = Product::whereIn('id', $requestedQty->keys())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($requestedQty as $productId => $qty) {
                $product = $products->get($productId);

                if (! $product || $product->status !== 'aktif') {
                    throw ValidationException::withMessages(['items' => 'Ada menu yang tidak tersedia.']);
                }

                if ($product->stok < $qty) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$product->nama_produk} tidak mencukupi (tersisa {$product->stok} {$product->unit}).",
                    ]);
                }
            }

            $subtotal = collect($data['items'])->sum(
                fn ($item) => (float) $products[$item['product_id']]->harga_jual * $item['qty']
            );

            [$voucherCode, $discount] = $this->resolveDiscount($data['voucher_code'] ?? null, $subtotal);
            $tax = round(($subtotal - $discount) * Order::TAX_RATE);
            $grandTotal = $subtotal - $discount + $tax;

            if ($data['metode_bayar'] === 'tunai') {
                $paid = (float) $data['uang_dibayar'];
                if ($paid < $grandTotal) {
                    throw ValidationException::withMessages([
                        'uang_dibayar' => 'Nominal pembayaran tunai kurang dari total tagihan.',
                    ]);
                }
            } else {
                // Pembayaran non-tunai selalu sesuai tagihan
                $paid = $grandTotal;
            }

            $order = Order::create([
                'invoice_number' => $this->nextInvoiceNumber(lock: true),
                'user_id' => $cashier->id,
                'tipe_pesanan' => $data['tipe_pesanan'],
                'nomor_meja' => $data['tipe_pesanan'] === 'dine_in' ? $data['nomor_meja'] : null,
                'nama_pemesan' => $data['nama_pemesan'] ?? null,
                'total_subtotal' => $subtotal,
                'voucher_code' => $voucherCode,
                'diskon_nominal' => $discount,
                'pajak_nominal' => $tax,
                'grand_total' => $grandTotal,
                'metode_bayar' => $data['metode_bayar'],
                'uang_dibayar' => $paid,
                'uang_kembali' => $paid - $grandTotal,
                'status' => Order::STATUS_DIPROSES,
            ]);

            foreach ($data['items'] as $item) {
                $product = $products[$item['product_id']];
                $order->items()->create([
                    'product_id' => $product->id,
                    'nama_produk' => $product->nama_produk,
                    'harga_satuan' => $product->harga_jual,
                    'harga_pokok' => $product->harga_pokok,
                    'kuantiti' => $item['qty'],
                    'subtotal_baris' => (float) $product->harga_jual * $item['qty'],
                    'catatan_khusus' => $item['catatan_khusus'] ?? null,
                ]);
            }

            foreach ($requestedQty as $productId => $qty) {
                $products[$productId]->decrement('stok', $qty);
            }

            return $order->load(['items', 'user:id,nama_lengkap']);
        }, attempts: 3);
    }

    /**
     * Ubah status pesanan. Hanya pesanan "diproses" yang dapat diubah;
     * pembatalan mengembalikan stok setiap item.
     */
    public function changeStatus(Order $order, string $status): Order
    {
        return DB::transaction(function () use ($order, $status) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($order->status !== Order::STATUS_DIPROSES) {
                throw ValidationException::withMessages([
                    'status' => 'Status pesanan yang sudah selesai atau dibatalkan tidak dapat diubah.',
                ]);
            }

            if ($status === Order::STATUS_DIBATALKAN) {
                foreach ($order->items as $item) {
                    Product::whereKey($item->product_id)->increment('stok', $item->kuantiti);
                }
            }

            $order->update(['status' => $status]);

            return $order->load(['items', 'user:id,nama_lengkap']);
        });
    }

    /**
     * Nomor faktur berformat INV-POS-YYYYMMDD-XXXX, berurutan per hari.
     * Dengan $lock = true, baris terakhir dikunci sehingga dua transaksi tidak mendapat nomor yang sama
     * (kolom invoice_number juga UNIQUE sebagai pengaman terakhir).
     */
    public function nextInvoiceNumber(bool $lock = false): string
    {
        $prefix = 'INV-POS-'.now()->format('Ymd').'-';

        $lastInvoice = Order::where('invoice_number', 'like', $prefix.'%')
            ->when($lock, fn ($query) => $query->lockForUpdate())
            ->orderByDesc('invoice_number')
            ->value('invoice_number');

        $sequence = $lastInvoice ? (int) substr($lastInvoice, -4) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    /** @return array{0: ?string, 1: float} */
    private function resolveDiscount(?string $code, float $subtotal): array
    {
        if (! $code) {
            return [null, 0];
        }

        $voucher = Voucher::where('kode', $code)->where('status', 'aktif')->first();

        if (! $voucher) {
            throw ValidationException::withMessages(['voucher_code' => 'Kode voucher tidak valid atau sudah tidak aktif.']);
        }

        if ($subtotal < (float) $voucher->min_belanja) {
            throw ValidationException::withMessages([
                'voucher_code' => 'Voucher '.$voucher->kode.' memerlukan minimum belanja Rp '.number_format($voucher->min_belanja, 0, ',', '.').'.',
            ]);
        }

        return [$voucher->kode, $voucher->discountFor($subtotal)];
    }
}

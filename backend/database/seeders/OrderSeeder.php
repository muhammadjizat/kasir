<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Riwayat transaksi 14 hari terakhir agar dashboard & laporan langsung berisi data.
 * Stok produk tidak dikurangi di sini supaya level stok demo dari MenuSeeder tetap terlihat.
 */
class OrderSeeder extends Seeder
{
    private const PAYMENT_METHODS = ['tunai', 'tunai', 'tunai', 'qris', 'qris', 'transfer', 'debit'];
    private const NOTES = [null, null, null, 'Less Sugar', 'Extra Ice', 'No Onion', 'Less Ice', 'Pedas'];
    private const NAMES = [null, 'Rina', 'Dimas', 'Putri', 'Fajar', 'Ayu', 'Kevin', 'Laras'];

    public function run(): void
    {
        mt_srand(2026);

        $cashiers = User::where('role', 'kasir')->get();
        $products = Product::all();
        $voucher = Voucher::where('kode', 'HEMAT10')->first();

        for ($daysAgo = 13; $daysAgo >= 0; $daysAgo--) {
            $date = now()->subDays($daysAgo)->startOfDay();
            $orderCount = $daysAgo === 0 ? 8 : mt_rand(8, 16);

            // Waktu transaksi diurutkan agar nomor faktur sesuai urutan jam
            $times = collect(range(1, $orderCount))
                ->map(fn () => $date->copy()->setTime(mt_rand(8, 21), mt_rand(0, 59)))
                ->sort()
                ->values();

            foreach ($times as $index => $time) {
                if ($time->isFuture()) {
                    $time = now()->subMinutes(($orderCount - $index) * 7);
                }
                $this->createOrder($time, $index + 1, $cashiers->random(), $products, $voucher, $daysAgo);
            }
        }
    }

    private function createOrder(Carbon $time, int $sequence, User $cashier, $products, Voucher $voucher, int $daysAgo): void
    {
        $lines = $products->random(mt_rand(1, 4))->map(fn ($product) => [
            'product' => $product,
            'qty' => mt_rand(1, 3),
            'note' => self::NOTES[array_rand(self::NOTES)],
        ]);

        $subtotal = $lines->sum(fn ($line) => $line['product']->harga_jual * $line['qty']);
        $useVoucher = mt_rand(1, 5) === 1 && $subtotal >= $voucher->min_belanja;
        $discount = $useVoucher ? $voucher->discountFor($subtotal) : 0;
        $tax = round(($subtotal - $discount) * Order::TAX_RATE);
        $grandTotal = $subtotal - $discount + $tax;

        $method = self::PAYMENT_METHODS[array_rand(self::PAYMENT_METHODS)];
        $paid = $method === 'tunai' ? ceil($grandTotal / 50000) * 50000 : $grandTotal;
        $isDineIn = mt_rand(0, 1) === 1;

        // Pesanan hari ini sebagian masih diproses; pesanan lama hampir semua selesai
        $roll = mt_rand(1, 100);
        $status = match (true) {
            $roll <= 5 => Order::STATUS_DIBATALKAN,
            $daysAgo === 0 && $roll <= 35 => Order::STATUS_DIPROSES,
            default => Order::STATUS_SELESAI,
        };

        $order = new Order([
            'invoice_number' => 'INV-POS-'.$time->format('Ymd').'-'.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT),
            'user_id' => $cashier->id,
            'tipe_pesanan' => $isDineIn ? 'dine_in' : 'takeaway',
            'nomor_meja' => $isDineIn ? str_pad((string) mt_rand(1, 15), 2, '0', STR_PAD_LEFT) : null,
            'nama_pemesan' => self::NAMES[array_rand(self::NAMES)],
            'total_subtotal' => $subtotal,
            'voucher_code' => $useVoucher ? $voucher->kode : null,
            'diskon_nominal' => $discount,
            'pajak_nominal' => $tax,
            'grand_total' => $grandTotal,
            'metode_bayar' => $method,
            'uang_dibayar' => $paid,
            'uang_kembali' => $paid - $grandTotal,
            'status' => $status,
        ]);
        $order->created_at = $time;
        $order->updated_at = $time;
        $order->save();

        foreach ($lines as $line) {
            $order->items()->create([
                'product_id' => $line['product']->id,
                'nama_produk' => $line['product']->nama_produk,
                'harga_satuan' => $line['product']->harga_jual,
                'harga_pokok' => $line['product']->harga_pokok,
                'kuantiti' => $line['qty'],
                'subtotal_baris' => $line['product']->harga_jual * $line['qty'],
                'catatan_khusus' => $line['note'],
            ]);
        }
    }
}

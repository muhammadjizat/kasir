<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class ReportService
{
    /** Query transaksi sesuai filter laporan (periode, kategori, metode bayar, status). */
    public function query(array $filters): Builder
    {
        $from = Carbon::parse($filters['from'])->startOfDay();
        $to = Carbon::parse($filters['to'])->endOfDay();

        return Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->when($filters['metode_bayar'] ?? null, fn ($q, $method) => $q->where('metode_bayar', $method))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['category_id'] ?? null, fn ($q, $categoryId) => $q->whereHas(
                'items.product',
                fn ($product) => $product->where('category_id', $categoryId)
            ));
    }

    /**
     * Ringkasan statistik. Transaksi dibatalkan tidak dihitung.
     * - Omset bruto   = jumlah subtotal sebelum diskon & pajak
     * - Omset bersih  = omset bruto - diskon (pajak PB1 adalah titipan, bukan pendapatan)
     * - Rata-rata     = grand total / jumlah transaksi
     * - Laba kotor    = omset bersih - HPP (harga pokok x kuantiti)
     */
    public function summary(Builder $query): array
    {
        $paidQuery = (clone $query)->paid();

        $totals = (clone $paidQuery)
            ->selectRaw('COUNT(*) as jumlah, COALESCE(SUM(total_subtotal),0) as bruto, COALESCE(SUM(diskon_nominal),0) as diskon, COALESCE(SUM(pajak_nominal),0) as pajak, COALESCE(SUM(grand_total),0) as grand')
            ->first();

        $hpp = (float) OrderDetail::whereIn('order_id', (clone $paidQuery)->select('id'))
            ->selectRaw('COALESCE(SUM(harga_pokok * kuantiti),0) as hpp')
            ->value('hpp');

        $net = (float) $totals->bruto - (float) $totals->diskon;

        return [
            'jumlah_transaksi' => (int) $totals->jumlah,
            'omset_bruto' => (float) $totals->bruto,
            'total_diskon' => (float) $totals->diskon,
            'total_pajak' => (float) $totals->pajak,
            'omset_bersih' => $net,
            'total_grand' => (float) $totals->grand,
            'rata_rata_transaksi' => $totals->jumlah ? round((float) $totals->grand / $totals->jumlah) : 0,
            'total_hpp' => $hpp,
            'laba_kotor' => $net - $hpp,
        ];
    }

    /** Bentuk baris tabel laporan. */
    public function row(Order $order): array
    {
        return [
            'id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'created_at' => $order->created_at,
            'kasir' => $order->user?->nama_lengkap,
            'tipe_pesanan' => $order->tipe_pesanan,
            'metode_bayar' => $order->metode_bayar,
            'item_terjual' => $order->items->map(fn ($item) => "{$item->nama_produk} x{$item->kuantiti}")->implode(', '),
            'total_subtotal' => (float) $order->total_subtotal,
            'diskon_nominal' => (float) $order->diskon_nominal,
            'pajak_nominal' => (float) $order->pajak_nominal,
            'grand_total' => (float) $order->grand_total,
            'status' => $order->status,
        ];
    }
}

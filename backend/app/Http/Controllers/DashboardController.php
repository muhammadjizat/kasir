<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->startOfDay();
        $weekStart = now()->subDays(6)->startOfDay();

        $todayOrders = Order::visibleTo($user)->paid()->where('created_at', '>=', $today);

        $bestSeller = OrderDetail::query()
            ->join('orders', 'orders.id', '=', 'order_details.order_id')
            ->where('orders.created_at', '>=', $today)
            ->where('orders.status', '!=', Order::STATUS_DIBATALKAN)
            ->when(! $user->isAdmin(), fn ($q) => $q->where('orders.user_id', $user->id))
            ->groupBy('order_details.nama_produk')
            ->selectRaw('order_details.nama_produk, SUM(order_details.kuantiti) as total_qty')
            ->orderByDesc('total_qty')
            ->first();

        $lowStock = Product::lowStock()->where('status', 'aktif')->orderBy('stok')->get(['id', 'nama_produk', 'stok', 'stok_minimum', 'unit']);

        // Tren 7 hari: isi hari tanpa transaksi dengan 0 agar grafik tetap utuh
        $dailyTotals = Order::visibleTo($user)->paid()
            ->where('created_at', '>=', $weekStart)
            ->selectRaw('DATE(created_at) as tanggal, SUM(grand_total) as omset, COUNT(*) as jumlah')
            ->groupBy('tanggal')
            ->get()
            ->keyBy('tanggal');

        $trend = collect(range(6, 0))->map(function ($daysAgo) use ($dailyTotals) {
            $date = now()->subDays($daysAgo)->toDateString();

            return [
                'tanggal' => $date,
                'omset' => (float) ($dailyTotals[$date]->omset ?? 0),
                'jumlah' => (int) ($dailyTotals[$date]->jumlah ?? 0),
            ];
        });

        $categoryDistribution = OrderDetail::query()
            ->join('orders', 'orders.id', '=', 'order_details.order_id')
            ->join('products', 'products.id', '=', 'order_details.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->where('orders.created_at', '>=', $weekStart)
            ->where('orders.status', '!=', Order::STATUS_DIBATALKAN)
            ->when(! $user->isAdmin(), fn ($q) => $q->where('orders.user_id', $user->id))
            ->groupBy('categories.nama_kategori')
            ->select('categories.nama_kategori as kategori', DB::raw('SUM(order_details.kuantiti) as qty'), DB::raw('SUM(order_details.subtotal_baris) as omset'))
            ->orderByDesc('qty')
            ->get();

        return response()->json([
            'omset_hari_ini' => (float) (clone $todayOrders)->sum('grand_total'),
            'jumlah_pesanan' => (clone $todayOrders)->count(),
            'menu_terlaris' => $bestSeller,
            'stok_rendah' => ['jumlah' => $lowStock->count(), 'items' => $lowStock->take(8)->values()],
            'tren_7_hari' => $trend,
            'distribusi_kategori' => $categoryDistribution,
            'transaksi_terbaru' => Order::visibleTo($user)->latest()->limit(10)->get(),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $orders = Order::visibleTo($request->user())
            ->with('user:id,nama_lengkap')
            ->when($request->search, fn ($q, $search) => $q->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")->orWhere('nama_pemesan', 'like', "%{$search}%");
            }))
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->from, fn ($q, $from) => $q->where('created_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($request->to, fn ($q, $to) => $q->where('created_at', '<=', Carbon::parse($to)->endOfDay()))
            ->latest()
            ->paginate(15);

        return response()->json([
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function nextInvoice(): JsonResponse
    {
        return response()->json(['invoice_number' => $this->orderService->nextInvoiceNumber()]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->create($request->user(), $request->validated());

        return response()->json(['message' => 'Transaksi berhasil disimpan.', 'data' => $order], 201);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorizeAccess($request, $order);

        return response()->json(['data' => $order->load(['items', 'user:id,nama_lengkap'])]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $this->authorizeAccess($request, $order);

        $data = $request->validate([
            'status' => ['required', Rule::in([Order::STATUS_SELESAI, Order::STATUS_DIBATALKAN])],
        ]);

        $order = $this->orderService->changeStatus($order, $data['status']);

        return response()->json(['message' => 'Status pesanan diperbarui.', 'data' => $order]);
    }

    private function authorizeAccess(Request $request, Order $order): void
    {
        $user = $request->user();
        abort_unless($user->isAdmin() || $order->user_id === $user->id, 403, 'Anda tidak memiliki akses ke transaksi ini.');
    }
}

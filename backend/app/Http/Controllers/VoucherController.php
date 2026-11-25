<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VoucherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vouchers = Voucher::query()
            ->when($request->search, fn ($q, $search) => $q->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%");
            }))
            ->orderBy('kode')
            ->get();

        return response()->json(['data' => $vouchers]);
    }

    public function store(Request $request): JsonResponse
    {
        $voucher = Voucher::create($this->validated($request));

        return response()->json(['message' => 'Voucher ditambahkan.', 'data' => $voucher], 201);
    }

    public function update(Request $request, Voucher $voucher): JsonResponse
    {
        $voucher->update($this->validated($request, $voucher));

        return response()->json(['message' => 'Voucher diperbarui.', 'data' => $voucher]);
    }

    public function destroy(Voucher $voucher): JsonResponse
    {
        $voucher->delete();

        return response()->json(['message' => 'Voucher dihapus.']);
    }

    /** Dipakai kasir untuk memeriksa kode voucher sebelum transaksi disimpan. */
    public function check(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kode' => ['required', 'string'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $voucher = Voucher::where('kode', strtoupper($data['kode']))->where('status', 'aktif')->first();

        if (! $voucher) {
            return response()->json(['message' => 'Kode voucher tidak valid atau sudah tidak aktif.'], 422);
        }

        return response()->json([
            'voucher' => $voucher,
            'diskon_nominal' => $voucher->discountFor((float) $data['subtotal']),
        ]);
    }

    private function validated(Request $request, ?Voucher $voucher = null): array
    {
        $request->merge([
            'kode' => strtoupper((string) $request->kode),
            'min_belanja' => $request->min_belanja ?: 0,
            'maks_diskon' => $request->maks_diskon ?: null,
        ]);

        return $request->validate([
            'kode' => ['required', 'string', 'max:30', 'alpha_dash', Rule::unique('vouchers')->ignore($voucher)],
            'nama' => ['required', 'string', 'max:100'],
            'tipe' => ['required', Rule::in(['persen', 'nominal'])],
            'nilai' => ['required', 'numeric', 'min:1', Rule::when($request->tipe === 'persen', ['max:100'])],
            'min_belanja' => ['nullable', 'numeric', 'min:0'],
            'maks_diskon' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
        ], [
            'kode.unique' => 'Kode voucher sudah digunakan.',
            'nilai.max' => 'Diskon persentase maksimal 100%.',
        ]);
    }
}

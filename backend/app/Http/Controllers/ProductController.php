<?php

namespace App\Http\Controllers;

use App\Models\OrderDetail;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::with('category:id,nama_kategori')
            ->when($request->search, fn ($q, $search) => $q->where(function ($q) use ($search) {
                $q->where('nama_produk', 'like', "%{$search}%")->orWhere('kode_produk', 'like', "%{$search}%");
            }))
            ->when($request->category_id, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->orderBy('category_id')
            ->orderBy('nama_produk')
            ->get();

        return response()->json(['data' => $products]);
    }

    public function store(Request $request): JsonResponse
    {
        $product = Product::create($this->validated($request));

        return response()->json(['message' => 'Menu ditambahkan.', 'data' => $product], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $product->update($this->validated($request, $product));

        return response()->json(['message' => 'Menu diperbarui.', 'data' => $product]);
    }

    public function destroy(Product $product): JsonResponse
    {
        // Menu yang sudah pernah terjual tidak dihapus agar riwayat transaksi tetap konsisten
        if (OrderDetail::where('product_id', $product->id)->exists()) {
            $product->update(['status' => 'nonaktif']);

            return response()->json(['message' => 'Menu sudah memiliki riwayat transaksi, sehingga dinonaktifkan.']);
        }

        $product->delete();

        return response()->json(['message' => 'Menu dihapus.']);
    }

    private function validated(Request $request, ?Product $product = null): array
    {
        return $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'kode_produk' => ['required', 'string', 'max:30', Rule::unique('products')->ignore($product)],
            'nama_produk' => ['required', 'string', 'max:150'],
            'harga_jual' => ['required', 'numeric', 'min:0', 'gte:harga_pokok'],
            'harga_pokok' => ['required', 'numeric', 'min:0'],
            'stok' => ['required', 'integer', 'min:0'],
            'stok_minimum' => ['required', 'integer', 'min:0'],
            'unit' => ['required', 'string', 'max:20'],
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
        ], [
            'kode_produk.unique' => 'Kode produk sudah digunakan.',
            'harga_jual.gte' => 'Harga jual tidak boleh lebih kecil dari harga pokok.',
            'category_id.required' => 'Kategori wajib dipilih.',
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::withCount('products')
            ->when($request->search, fn ($q, $search) => $q->where('nama_kategori', 'like', "%{$search}%"))
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $category = Category::create($data + ['slug' => Str::slug($data['nama_kategori'])]);

        return response()->json(['message' => 'Kategori ditambahkan.', 'data' => $category], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $this->validated($request, $category);
        $category->update($data + ['slug' => Str::slug($data['nama_kategori'])]);

        return response()->json(['message' => 'Kategori diperbarui.', 'data' => $category]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json(['message' => 'Kategori masih memiliki menu. Pindahkan atau nonaktifkan kategori.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Kategori dihapus.']);
    }

    private function validated(Request $request, ?Category $category = null): array
    {
        return $request->validate([
            'nama_kategori' => ['required', 'string', 'max:100', Rule::unique('categories')->ignore($category)],
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
        ], [
            'nama_kategori.unique' => 'Nama kategori sudah digunakan.',
        ]);
    }
}

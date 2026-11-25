<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->search, fn ($q, $search) => $q->where(function ($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->orderBy('role')
            ->orderBy('nama_lengkap')
            ->get();

        return response()->json(['data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = User::create($this->validated($request));

        return response()->json(['message' => 'Pengguna ditambahkan.', 'data' => $user], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $this->validated($request, $user);

        if ($request->user()->is($user) && ($data['role'] !== 'admin' || $data['status'] !== 'aktif')) {
            return response()->json(['message' => 'Anda tidak dapat menurunkan role atau menonaktifkan akun sendiri.'], 422);
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        // Akun yang dinonaktifkan langsung kehilangan seluruh sesi login
        if ($user->status !== 'aktif') {
            $user->tokens()->delete();
        }

        return response()->json(['message' => 'Pengguna diperbarui.', 'data' => $user]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            return response()->json(['message' => 'Anda tidak dapat menghapus akun sendiri.'], 422);
        }

        if ($user->orders()->exists()) {
            $user->update(['status' => 'nonaktif']);
            $user->tokens()->delete();

            return response()->json(['message' => 'Pengguna memiliki riwayat transaksi, sehingga dinonaktifkan.']);
        }

        $user->delete();

        return response()->json(['message' => 'Pengguna dihapus.']);
    }

    private function validated(Request $request, ?User $user = null): array
    {
        $request->merge(['email' => $request->email ?: null]);

        return $request->validate([
            'nama_lengkap' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('users')->ignore($user)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users')->ignore($user)],
            'password' => [$user ? 'nullable' : 'required', Password::min(6)],
            'role' => ['required', Rule::in(['admin', 'kasir'])],
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
        ], [
            'username.unique' => 'Username sudah digunakan.',
            'email.unique' => 'Email sudah digunakan.',
        ]);
    }
}

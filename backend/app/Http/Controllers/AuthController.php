<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'login' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string', 'min:6'],
        ], [
            'login.required' => 'Username atau email wajib diisi.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 6 karakter.',
        ]);

        $field = filter_var($credentials['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $user = User::where($field, $credentials['login'])->first();

        if (! $user) {
            throw ValidationException::withMessages(['login' => 'Username atau email tidak terdaftar.']);
        }

        if (! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => 'Password yang Anda masukkan salah.']);
        }

        if ($user->status !== 'aktif') {
            throw ValidationException::withMessages(['login' => 'Akun Anda dinonaktifkan. Hubungi administrator.']);
        }

        $token = $user->createToken('pos-session', [$user->role], now()->addHours(12))->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    public function logout(Request $request): JsonResponse
    {
        // Hapus token yang sedang dipakai sehingga sesi benar-benar berakhir di server
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }
}

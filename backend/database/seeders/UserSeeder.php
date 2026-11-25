<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Password otomatis di-hash bcrypt melalui cast 'hashed' pada model User
        $users = [
            ['username' => 'admin', 'nama_lengkap' => 'Andi Manager', 'email' => 'admin@titiktemu.test', 'password' => 'admin123', 'role' => 'admin'],
            ['username' => 'kasir', 'nama_lengkap' => 'Siti Kasir', 'email' => 'kasir@titiktemu.test', 'password' => 'kasir123', 'role' => 'kasir'],
            ['username' => 'kasir2', 'nama_lengkap' => 'Budi Waiter', 'email' => 'kasir2@titiktemu.test', 'password' => 'kasir123', 'role' => 'kasir'],
        ];

        foreach ($users as $user) {
            User::create($user + ['status' => 'aktif']);
        }
    }
}

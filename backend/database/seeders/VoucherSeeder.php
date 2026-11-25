<?php

namespace Database\Seeders;

use App\Models\Voucher;
use Illuminate\Database\Seeder;

class VoucherSeeder extends Seeder
{
    public function run(): void
    {
        Voucher::insert([
            ['kode' => 'HEMAT10', 'nama' => 'Diskon 10% (maks. 20rb)', 'tipe' => 'persen', 'nilai' => 10, 'min_belanja' => 50000, 'maks_diskon' => 20000, 'status' => 'aktif', 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'NGOPI5K', 'nama' => 'Potongan Rp5.000', 'tipe' => 'nominal', 'nilai' => 5000, 'min_belanja' => 30000, 'maks_diskon' => null, 'status' => 'aktif', 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'MERDEKA17', 'nama' => 'Promo 17 Agustus', 'tipe' => 'persen', 'nilai' => 17, 'min_belanja' => 0, 'maks_diskon' => 25000, 'status' => 'nonaktif', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}

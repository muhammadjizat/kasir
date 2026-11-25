<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // [kode, nama, harga jual, harga pokok, stok, stok minimum, unit]
        $menu = [
            'Coffee' => [
                ['CF-001', 'Espresso', 18000, 6000, 80, 10, 'cup'],
                ['CF-002', 'Americano', 22000, 7000, 75, 10, 'cup'],
                ['CF-003', 'Cappuccino', 28000, 10000, 60, 10, 'cup'],
                ['CF-004', 'Caffe Latte', 28000, 10000, 65, 10, 'cup'],
                ['CF-005', 'Es Kopi Susu Gula Aren', 25000, 9000, 90, 15, 'cup'],
                ['CF-006', 'Vanilla Latte', 32000, 12000, 8, 10, 'cup'],
            ],
            'Non-Coffee' => [
                ['NC-001', 'Matcha Latte', 30000, 12000, 45, 10, 'cup'],
                ['NC-002', 'Red Velvet Latte', 30000, 11000, 40, 10, 'cup'],
                ['NC-003', 'Chocolate Signature', 28000, 10000, 50, 10, 'cup'],
                ['NC-004', 'Lemon Tea', 20000, 5000, 4, 8, 'cup'],
            ],
            'Food' => [
                ['FD-001', 'Nasi Goreng Kampung', 35000, 15000, 30, 5, 'porsi'],
                ['FD-002', 'Mie Goreng Spesial', 32000, 13000, 30, 5, 'porsi'],
                ['FD-003', 'Chicken Katsu Rice', 38000, 17000, 25, 5, 'porsi'],
                ['FD-004', 'French Fries', 22000, 8000, 40, 8, 'porsi'],
            ],
            'Pastry' => [
                ['PS-001', 'Croissant Butter', 22000, 9000, 20, 5, 'pcs'],
                ['PS-002', 'Pain au Chocolat', 25000, 10000, 3, 5, 'pcs'],
                ['PS-003', 'Cinnamon Roll', 24000, 9500, 18, 5, 'pcs'],
                ['PS-004', 'Banana Bread', 20000, 7500, 0, 4, 'slice'],
            ],
        ];

        foreach ($menu as $categoryName => $products) {
            $category = Category::create([
                'nama_kategori' => $categoryName,
                'slug' => Str::slug($categoryName),
                'status' => 'aktif',
            ]);

            foreach ($products as [$code, $name, $price, $cost, $stock, $minStock, $unit]) {
                $category->products()->create([
                    'kode_produk' => $code,
                    'nama_produk' => $name,
                    'harga_jual' => $price,
                    'harga_pokok' => $cost,
                    'stok' => $stock,
                    'stok_minimum' => $minStock,
                    'unit' => $unit,
                    'status' => 'aktif',
                ]);
            }
        }
    }
}

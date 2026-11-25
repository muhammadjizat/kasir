<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            // Nama & harga disalin saat transaksi agar riwayat tidak berubah ketika master menu diubah
            $table->string('nama_produk', 150);
            $table->decimal('harga_satuan', 12, 2);
            $table->decimal('harga_pokok', 12, 2)->default(0);
            $table->unsignedInteger('kuantiti');
            $table->decimal('subtotal_baris', 12, 2);
            $table->string('catatan_khusus', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_details');
    }
};

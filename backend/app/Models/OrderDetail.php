<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderDetail extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'nama_produk',
        'harga_satuan',
        'harga_pokok',
        'kuantiti',
        'subtotal_baris',
        'catatan_khusus',
    ];

    protected $hidden = ['harga_pokok'];

    protected function casts(): array
    {
        return [
            'harga_satuan' => 'decimal:2',
            'harga_pokok' => 'decimal:2',
            'kuantiti' => 'integer',
            'subtotal_baris' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

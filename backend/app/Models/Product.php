<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'kode_produk',
        'nama_produk',
        'harga_jual',
        'harga_pokok',
        'stok',
        'stok_minimum',
        'unit',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'category_id' => 'integer',
            'harga_jual' => 'decimal:2',
            'harga_pokok' => 'decimal:2',
            'stok' => 'integer',
            'stok_minimum' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereColumn('stok', '<=', 'stok_minimum');
    }
}

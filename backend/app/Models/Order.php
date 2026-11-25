<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUS_DIPROSES = 'diproses';
    public const STATUS_SELESAI = 'selesai';
    public const STATUS_DIBATALKAN = 'dibatalkan';

    public const TAX_RATE = 0.10;

    protected $fillable = [
        'invoice_number',
        'user_id',
        'tipe_pesanan',
        'nomor_meja',
        'nama_pemesan',
        'total_subtotal',
        'voucher_code',
        'diskon_nominal',
        'pajak_nominal',
        'grand_total',
        'metode_bayar',
        'uang_dibayar',
        'uang_kembali',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'total_subtotal' => 'decimal:2',
            'diskon_nominal' => 'decimal:2',
            'pajak_nominal' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'uang_dibayar' => 'decimal:2',
            'uang_kembali' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderDetail::class);
    }

    /** Transaksi yang sudah dibayar (lunas) = semua yang tidak dibatalkan. */
    public function scopePaid(Builder $query): Builder
    {
        return $query->where('orders.status', '!=', self::STATUS_DIBATALKAN);
    }

    /** Kasir hanya boleh melihat transaksinya sendiri; admin melihat semua. */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $user->isAdmin() ? $query : $query->where('orders.user_id', $user->id);
    }
}

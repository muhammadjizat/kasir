<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $fillable = ['kode', 'nama', 'tipe', 'nilai', 'min_belanja', 'maks_diskon', 'status'];

    protected function casts(): array
    {
        return [
            'nilai' => 'decimal:2',
            'min_belanja' => 'decimal:2',
            'maks_diskon' => 'decimal:2',
        ];
    }

    /**
     * Hitung potongan untuk subtotal tertentu. Logika ini dicerminkan di frontend (calculateDiscount).
     */
    public function discountFor(float $subtotal): float
    {
        if ($subtotal < (float) $this->min_belanja) {
            return 0;
        }

        $discount = $this->tipe === 'persen'
            ? round($subtotal * (float) $this->nilai / 100)
            : (float) $this->nilai;

        if ($this->maks_diskon !== null && (float) $this->maks_diskon > 0) {
            $discount = min($discount, (float) $this->maks_diskon);
        }

        return min($discount, $subtotal);
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipe_pesanan' => ['required', Rule::in(['dine_in', 'takeaway'])],
            'nomor_meja' => ['nullable', 'required_if:tipe_pesanan,dine_in', 'string', 'max:10'],
            'nama_pemesan' => ['nullable', 'string', 'max:100'],
            'voucher_code' => ['nullable', 'string', 'max:30'],
            'metode_bayar' => ['required', Rule::in(['tunai', 'qris', 'transfer', 'debit'])],
            'uang_dibayar' => ['required', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:999'],
            'items.*.catatan_khusus' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'nomor_meja.required_if' => 'Nomor meja wajib diisi untuk pesanan Dine-In.',
            'items.required' => 'Minimal satu item pesanan harus ditambahkan.',
            'items.min' => 'Minimal satu item pesanan harus ditambahkan.',
            'items.*.product_id.required' => 'Pilih menu pada setiap baris pesanan.',
            'items.*.product_id.exists' => 'Menu yang dipilih tidak ditemukan.',
            'items.*.qty.min' => 'Kuantiti minimal 1.',
            'metode_bayar.in' => 'Metode pembayaran tidak valid.',
        ];
    }
}

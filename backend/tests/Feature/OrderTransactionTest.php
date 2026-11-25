<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderTransactionTest extends TestCase
{
    use RefreshDatabase;

    private Product $latte;
    private Product $croissant;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::create(['nama_kategori' => 'Coffee', 'slug' => 'coffee', 'status' => 'aktif']);
        $this->latte = $category->products()->create([
            'kode_produk' => 'CF-1', 'nama_produk' => 'Latte', 'harga_jual' => 25000, 'harga_pokok' => 9000,
            'stok' => 5, 'stok_minimum' => 2, 'unit' => 'cup', 'status' => 'aktif',
        ]);
        $this->croissant = $category->products()->create([
            'kode_produk' => 'PS-1', 'nama_produk' => 'Croissant', 'harga_jual' => 20000, 'harga_pokok' => 8000,
            'stok' => 1, 'stok_minimum' => 2, 'unit' => 'pcs', 'status' => 'aktif',
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'tipe_pesanan' => 'dine_in',
            'nomor_meja' => '05',
            'metode_bayar' => 'tunai',
            'uang_dibayar' => 100000,
            'items' => [['product_id' => $this->latte->id, 'qty' => 2, 'catatan_khusus' => 'Less Sugar']],
        ], $overrides);
    }

    public function test_guest_cannot_access_protected_endpoints(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();
        $this->postJson('/api/orders', $this->payload())->assertUnauthorized();
        $this->getJson('/api/reports?from=2026-01-01&to=2026-01-31')->assertUnauthorized();
    }

    public function test_password_is_hashed_and_login_validates_credentials(): void
    {
        $user = User::factory()->create(['username' => 'kasir', 'password' => 'rahasia123']);

        $this->assertNotSame('rahasia123', $user->getRawOriginal('password'));
        $this->postJson('/api/login', ['login' => 'kasir', 'password' => 'salah123'])->assertJsonValidationErrors('password');
        $this->postJson('/api/login', ['login' => 'tidakada', 'password' => 'rahasia123'])->assertJsonValidationErrors('login');
        $this->postJson('/api/login', ['login' => 'kasir', 'password' => 'rahasia123'])->assertOk()->assertJsonStructure(['token', 'user']);
    }

    public function test_cashier_cannot_open_admin_features(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/reports?from=2026-01-01&to=2026-01-31')->assertForbidden();
        $this->postJson('/api/products', [])->assertForbidden();
        $this->getJson('/api/users')->assertForbidden();
    }

    public function test_order_is_saved_with_calculated_totals_and_stock_is_reduced(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Voucher::create(['kode' => 'HEMAT10', 'nama' => '10%', 'tipe' => 'persen', 'nilai' => 10, 'min_belanja' => 0, 'status' => 'aktif']);

        $response = $this->postJson('/api/orders', $this->payload(['voucher_code' => 'HEMAT10']))->assertCreated();

        // Subtotal 50.000 - diskon 5.000 = 45.000; PB1 10% = 4.500; total 49.500
        $response->assertJsonPath('data.total_subtotal', '50000.00')
            ->assertJsonPath('data.diskon_nominal', '5000.00')
            ->assertJsonPath('data.pajak_nominal', '4500.00')
            ->assertJsonPath('data.grand_total', '49500.00')
            ->assertJsonPath('data.uang_kembali', '50500.00');

        $this->assertMatchesRegularExpression('/^INV-POS-\d{8}-0001$/', $response->json('data.invoice_number'));
        $this->assertSame(3, $this->latte->fresh()->stok);
        $this->assertDatabaseCount('order_details', 1);
    }

    public function test_invoice_numbers_are_sequential_and_unique(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $first = $this->postJson('/api/orders', $this->payload(['items' => [['product_id' => $this->latte->id, 'qty' => 1]]]))->json('data.invoice_number');
        $second = $this->postJson('/api/orders', $this->payload(['items' => [['product_id' => $this->latte->id, 'qty' => 1]]]))->json('data.invoice_number');

        $this->assertStringEndsWith('-0001', $first);
        $this->assertStringEndsWith('-0002', $second);
    }

    public function test_insufficient_stock_rolls_back_whole_transaction(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/orders', $this->payload([
            'items' => [
                ['product_id' => $this->latte->id, 'qty' => 1],
                ['product_id' => $this->croissant->id, 'qty' => 2],
            ],
        ]))->assertJsonValidationErrors('items');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_details', 0);
        $this->assertSame(5, $this->latte->fresh()->stok);
    }

    public function test_cash_payment_lower_than_total_is_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/orders', $this->payload(['uang_dibayar' => 10000]))->assertJsonValidationErrors('uang_dibayar');
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_dine_in_requires_table_number(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/orders', $this->payload(['nomor_meja' => null]))->assertJsonValidationErrors('nomor_meja');
    }

    public function test_cancelling_order_restores_stock_and_locks_status(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $orderId = $this->postJson('/api/orders', $this->payload())->json('data.id');

        $this->patchJson("/api/orders/{$orderId}/status", ['status' => 'dibatalkan'])->assertOk();
        $this->assertSame(5, $this->latte->fresh()->stok);
        $this->assertSame(Order::STATUS_DIBATALKAN, Order::find($orderId)->status);

        $this->patchJson("/api/orders/{$orderId}/status", ['status' => 'selesai'])->assertJsonValidationErrors('status');
    }

    public function test_cashier_only_sees_own_orders(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $orderId = $this->postJson('/api/orders', $this->payload())->json('data.id');

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/orders/{$orderId}")->assertForbidden();
        $this->getJson('/api/orders')->assertJsonCount(0, 'data');

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->getJson("/api/orders/{$orderId}")->assertOk();
    }
}

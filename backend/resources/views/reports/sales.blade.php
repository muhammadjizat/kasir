@php
    $rp = fn ($value) => 'Rp '.number_format($value, 0, ',', '.');
    $typeLabels = ['dine_in' => 'Dine-In', 'takeaway' => 'Takeaway'];
    $statusLabels = ['diproses' => 'Diproses', 'selesai' => 'Selesai', 'dibatalkan' => 'Dibatalkan'];
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Penjualan</title>
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { font-size: 9px; color: #2b211b; }
        h1 { font-size: 16px; margin: 0; color: #7c4a2d; }
        .sub { color: #85766b; margin: 2px 0 10px; }
        .filters td { padding: 1px 10px 1px 0; }
        .summary { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin: 10px -6px 12px; }
        .summary td { border: 1px solid #e8e1d8; background: #faf8f5; padding: 6px 8px; width: 16.6%; }
        .summary .label { color: #85766b; font-size: 8px; }
        .summary .value { font-size: 11px; font-weight: bold; }
        table.data { width: 100%; border-collapse: collapse; }
        table.data th { background: #7c4a2d; color: #fff; padding: 5px 4px; text-align: left; font-size: 8.5px; }
        table.data td { border-bottom: 1px solid #e8e1d8; padding: 4px; vertical-align: top; }
        table.data tr:nth-child(even) td { background: #faf8f5; }
        .right { text-align: right; }
        .void { color: #c0453a; }
        tfoot td { font-weight: bold; border-top: 2px solid #7c4a2d; }
        .footer { margin-top: 12px; color: #85766b; font-size: 8px; }
    </style>
</head>
<body>
    <h1>Laporan Penjualan — Titik Temu Kopi</h1>
    <div class="sub">Dicetak {{ now()->translatedFormat('d F Y H:i') }}</div>

    <table class="filters">
        @foreach ($filterInfo as $label => $value)
            <tr><td><strong>{{ $label }}</strong></td><td>{{ $value }}</td></tr>
        @endforeach
    </table>

    <table class="summary">
        <tr>
            <td><div class="label">Omset Bruto</div><div class="value">{{ $rp($summary['omset_bruto']) }}</div></td>
            <td><div class="label">Total Diskon</div><div class="value">{{ $rp($summary['total_diskon']) }}</div></td>
            <td><div class="label">Pajak Terkumpul</div><div class="value">{{ $rp($summary['total_pajak']) }}</div></td>
            <td><div class="label">Omset Bersih</div><div class="value">{{ $rp($summary['omset_bersih']) }}</div></td>
            <td><div class="label">Rata-rata Transaksi</div><div class="value">{{ $rp($summary['rata_rata_transaksi']) }}</div></td>
            <td><div class="label">Transaksi Lunas</div><div class="value">{{ $summary['jumlah_transaksi'] }}</div></td>
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                <th>No</th>
                <th>No. Faktur</th>
                <th>Tanggal & Jam</th>
                <th>Kasir</th>
                <th>Tipe</th>
                <th>Item Terjual</th>
                <th class="right">Subtotal</th>
                <th class="right">Pajak</th>
                <th class="right">Grand Total</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $index => $row)
                <tr class="{{ $row['status'] === 'dibatalkan' ? 'void' : '' }}">
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $row['invoice_number'] }}</td>
                    <td>{{ $row['created_at']->format('d/m/Y H:i') }}</td>
                    <td>{{ $row['kasir'] }}</td>
                    <td>{{ $typeLabels[$row['tipe_pesanan']] }}</td>
                    <td style="width: 28%">{{ $row['item_terjual'] }}</td>
                    <td class="right">{{ $rp($row['total_subtotal']) }}</td>
                    <td class="right">{{ $rp($row['pajak_nominal']) }}</td>
                    <td class="right">{{ $rp($row['grand_total']) }}</td>
                    <td>{{ $statusLabels[$row['status']] }}</td>
                </tr>
            @empty
                <tr><td colspan="10" style="text-align:center; padding: 16px">Tidak ada transaksi pada periode ini.</td></tr>
            @endforelse
        </tbody>
        @if ($rows->isNotEmpty())
            <tfoot>
                <tr>
                    <td colspan="6">Total (tidak termasuk transaksi dibatalkan)</td>
                    <td class="right">{{ $rp($summary['omset_bruto']) }}</td>
                    <td class="right">{{ $rp($summary['total_pajak']) }}</td>
                    <td class="right">{{ $rp($summary['total_grand']) }}</td>
                    <td></td>
                </tr>
            </tfoot>
        @endif
    </table>

    <div class="footer">Laba kotor periode ini: {{ $rp($summary['laba_kotor']) }} (HPP {{ $rp($summary['total_hpp']) }})</div>
</body>
</html>

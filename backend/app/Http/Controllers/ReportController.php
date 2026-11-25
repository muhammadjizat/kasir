<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private const PAYMENT_LABELS = ['tunai' => 'Tunai', 'qris' => 'QRIS', 'transfer' => 'Transfer Bank', 'debit' => 'Kartu Debit'];
    private const TYPE_LABELS = ['dine_in' => 'Dine-In', 'takeaway' => 'Takeaway'];
    private const STATUS_LABELS = ['diproses' => 'Diproses', 'selesai' => 'Selesai', 'dibatalkan' => 'Dibatalkan'];

    private const TABLE_HEADINGS = ['No', 'No. Faktur', 'Tanggal & Jam', 'Kasir', 'Tipe Pesanan', 'Metode Bayar', 'Item Terjual', 'Subtotal', 'Diskon', 'Pajak', 'Grand Total', 'Status'];

    public function __construct(private ReportService $reportService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $this->filters($request);
        $query = $this->reportService->query($filters);

        $orders = (clone $query)->with(['user:id,nama_lengkap', 'items'])->latest()->paginate(20);

        return response()->json([
            'summary' => $this->reportService->summary($query),
            'data' => collect($orders->items())->map(fn ($order) => $this->reportService->row($order)),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function export(Request $request): Response
    {
        $filters = $this->filters($request);
        $format = $request->validate(['format' => ['required', Rule::in(['pdf', 'xlsx', 'csv'])]])['format'];

        $query = $this->reportService->query($filters);
        $summary = $this->reportService->summary($query);
        $rows = (clone $query)->with(['user:id,nama_lengkap', 'items'])->oldest()->get()
            ->map(fn ($order) => $this->reportService->row($order));

        $fileName = 'laporan-penjualan-'.$filters['from'].'_sd_'.$filters['to'];
        $filterInfo = $this->describeFilters($filters);

        return match ($format) {
            'pdf' => Pdf::loadView('reports.sales', compact('rows', 'summary', 'filterInfo'))
                ->setPaper('a4', 'landscape')
                ->download($fileName.'.pdf'),
            'xlsx' => $this->exportExcel($rows, $summary, $filterInfo, $fileName.'.xlsx'),
            'csv' => $this->exportCsv($rows, $fileName.'.csv'),
        };
    }

    private function filters(Request $request): array
    {
        return $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'metode_bayar' => ['nullable', Rule::in(array_keys(self::PAYMENT_LABELS))],
            'status' => ['nullable', Rule::in(array_keys(self::STATUS_LABELS))],
        ], [
            'to.after_or_equal' => 'Tanggal akhir tidak boleh sebelum tanggal awal.',
        ]);
    }

    private function describeFilters(array $filters): array
    {
        return [
            'Periode' => Carbon::parse($filters['from'])->translatedFormat('d M Y').' s/d '.Carbon::parse($filters['to'])->translatedFormat('d M Y'),
            'Kategori' => ! empty($filters['category_id']) ? Category::find($filters['category_id'])->nama_kategori : 'Semua',
            'Pembayaran' => self::PAYMENT_LABELS[$filters['metode_bayar'] ?? ''] ?? 'Semua',
            'Status' => self::STATUS_LABELS[$filters['status'] ?? ''] ?? 'Semua',
        ];
    }

    private function tableRow(int $index, array $row): array
    {
        return [
            $index + 1,
            $row['invoice_number'],
            $row['created_at']->format('d/m/Y H:i'),
            $row['kasir'],
            self::TYPE_LABELS[$row['tipe_pesanan']],
            self::PAYMENT_LABELS[$row['metode_bayar']],
            $row['item_terjual'],
            $row['total_subtotal'],
            $row['diskon_nominal'],
            $row['pajak_nominal'],
            $row['grand_total'],
            self::STATUS_LABELS[$row['status']],
        ];
    }

    private function exportCsv(Collection $rows, string $fileName): StreamedResponse
    {
        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF"); // BOM agar Excel membaca UTF-8 dengan benar
            fputcsv($handle, self::TABLE_HEADINGS);
            foreach ($rows as $index => $row) {
                fputcsv($handle, $this->tableRow($index, $row));
            }
            fclose($handle);
        }, $fileName, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function exportExcel(Collection $rows, array $summary, array $filterInfo, string $fileName): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet()->setTitle('Laporan Penjualan');

        $sheet->setCellValue('A1', 'LAPORAN PENJUALAN - TITIK TEMU KOPI')->mergeCells('A1:L1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $line = 2;
        foreach ($filterInfo as $label => $value) {
            $sheet->setCellValue("A{$line}", $label)->setCellValue("B{$line}", $value);
            $line++;
        }

        $line++;
        $summaryRows = [
            'Omset Bruto' => $summary['omset_bruto'],
            'Total Diskon' => $summary['total_diskon'],
            'Total Pajak (PB1)' => $summary['total_pajak'],
            'Omset Bersih' => $summary['omset_bersih'],
            'Rata-rata Transaksi' => $summary['rata_rata_transaksi'],
            'Jumlah Transaksi Lunas' => $summary['jumlah_transaksi'],
        ];
        foreach ($summaryRows as $label => $value) {
            $sheet->setCellValue("A{$line}", $label)->setCellValue("C{$line}", $value);
            $sheet->getStyle("A{$line}")->getFont()->setBold(true);
            $sheet->getStyle("C{$line}")->getNumberFormat()->setFormatCode('#,##0');
            $line++;
        }

        $line++;
        $headerRow = $line;
        $sheet->fromArray(self::TABLE_HEADINGS, null, "A{$headerRow}");
        $sheet->getStyle("A{$headerRow}:L{$headerRow}")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '7C4A2D']],
        ]);

        $dataRows = $rows->values()->map(fn ($row, $index) => $this->tableRow($index, $row))->all();
        if ($dataRows) {
            $sheet->fromArray($dataRows, null, 'A'.($headerRow + 1));
        }

        $lastRow = $headerRow + max(count($dataRows), 1);
        $sheet->getStyle("A{$headerRow}:L{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle("H".($headerRow + 1).":K{$lastRow}")->getNumberFormat()->setFormatCode('#,##0');
        foreach (range('A', 'L') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        $sheet->getColumnDimension('G')->setAutoSize(false)->setWidth(50);
        $sheet->getStyle("G{$headerRow}:G{$lastRow}")->getAlignment()->setWrapText(true);

        return response()->streamDownload(
            fn () => (new Xlsx($spreadsheet))->save('php://output'),
            $fileName,
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        );
    }
}

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { downloadFile, errorMessage } from '../lib/api'
import { daysAgoISO, dateTime, ORDER_STATUSES, ORDER_TYPES, PAYMENT_METHODS, rupiah, todayISO } from '../lib/format'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import StatusBadge from '../components/StatusBadge'

export default function ReportsPage() {
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    from: daysAgoISO(6),
    to: todayISO(),
    category_id: '',
    metode_bayar: '',
    status: '',
  })
  const [page, setPage] = useState(1)
  const [report, setReport] = useState(null)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data))
  }, [])

  const loadReport = useCallback(() => {
    api
      .get('/reports', { params: { ...filters, page } })
      .then(({ data }) => setReport(data))
      .catch((error) => toast.error(errorMessage(error)))
  }, [filters, page])

  useEffect(loadReport, [loadReport])

  const setFilter = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value })
    setPage(1)
  }

  async function exportReport(format) {
    if (filters.from > filters.to) {
      toast.error('Tanggal awal tidak boleh melebihi tanggal akhir')
      return
    }
    setExporting(format)
    try {
      await downloadFile('/reports/export', { ...filters, format }, `laporan-penjualan.${format}`)
      toast.success(`Laporan ${format.toUpperCase()} berhasil diunduh`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setExporting('')
    }
  }

  const summary = report?.summary

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Laporan Penjualan</h1>
          <p className="muted">Rekap transaksi berdasarkan periode, kategori, dan metode pembayaran.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => exportReport('csv')} disabled={!!exporting}>
            <Icon name="download" /> {exporting === 'csv' ? 'Mengunduh...' : 'CSV'}
          </button>
          <button className="btn btn-outline" onClick={() => exportReport('xlsx')} disabled={!!exporting}>
            <Icon name="download" /> {exporting === 'xlsx' ? 'Mengunduh...' : 'Excel'}
          </button>
          <button className="btn btn-primary" onClick={() => exportReport('pdf')} disabled={!!exporting}>
            <Icon name="download" /> {exporting === 'pdf' ? 'Mengunduh...' : 'PDF'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <label className="inline-field">
            Dari
            <input type="date" value={filters.from} max={filters.to} onChange={setFilter('from')} />
          </label>
          <label className="inline-field">
            s/d
            <input type="date" value={filters.to} min={filters.from} onChange={setFilter('to')} />
          </label>
          <select value={filters.category_id} onChange={setFilter('category_id')}>
            <option value="">Semua Kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nama_kategori}
              </option>
            ))}
          </select>
          <select value={filters.metode_bayar} onChange={setFilter('metode_bayar')}>
            <option value="">Semua Pembayaran</option>
            {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select value={filters.status} onChange={setFilter('status')}>
            <option value="">Semua Status</option>
            {Object.entries(ORDER_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {summary && (
        <div className="summary-bar">
          <div>
            <span>Omset Bruto</span>
            <strong>{rupiah(summary.omset_bruto)}</strong>
          </div>
          <div>
            <span>Total Diskon</span>
            <strong className="text-red">{rupiah(summary.total_diskon)}</strong>
          </div>
          <div>
            <span>Pajak Terkumpul</span>
            <strong>{rupiah(summary.total_pajak)}</strong>
          </div>
          <div>
            <span>Omset Bersih</span>
            <strong>{rupiah(summary.omset_bersih)}</strong>
          </div>
          <div>
            <span>Rata-rata Transaksi</span>
            <strong>{rupiah(summary.rata_rata_transaksi)}</strong>
          </div>
          <div>
            <span>Laba Kotor</span>
            <strong className="text-green">{rupiah(summary.laba_kotor)}</strong>
            <small>HPP {rupiah(summary.total_hpp)}</small>
          </div>
        </div>
      )}
      {summary && (
        <p className="hint">
          {summary.jumlah_transaksi} transaksi lunas dihitung pada ringkasan (transaksi dibatalkan tidak dihitung).
        </p>
      )}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>No. Faktur</th>
                <th>Tanggal & Jam</th>
                <th>Kasir</th>
                <th>Tipe</th>
                <th>Item Terjual</th>
                <th className="right">Subtotal</th>
                <th className="right">Pajak</th>
                <th className="right">Grand Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report?.data.map((order, index) => (
                <tr key={order.id}>
                  <td>{(report.meta.current_page - 1) * report.meta.per_page + index + 1}</td>
                  <td className="mono">{order.invoice_number}</td>
                  <td>{dateTime(order.created_at)}</td>
                  <td>{order.kasir}</td>
                  <td>{ORDER_TYPES[order.tipe_pesanan]}</td>
                  <td className="items-cell">{order.item_terjual}</td>
                  <td className="right">{rupiah(order.total_subtotal)}</td>
                  <td className="right">{rupiah(order.pajak_nominal)}</td>
                  <td className="right strong">{rupiah(order.grand_total)}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
              {report && !report.data.length && (
                <tr>
                  <td colSpan="10" className="empty">
                    Tidak ada transaksi pada filter ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination meta={report?.meta} onChange={setPage} />
      </div>
    </div>
  )
}

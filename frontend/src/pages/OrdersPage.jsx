import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../lib/api'
import { dateTime, ORDER_STATUSES, ORDER_TYPES, PAYMENT_METHODS, rupiah } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import StatusBadge from '../components/StatusBadge'

export default function OrdersPage() {
  const { isAdmin } = useAuth()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    status: '',
    from: '',
    to: '',
  }))

  useEffect(() => {
    const q = searchParams.get('search')
    if (q !== null) setFilters((prev) => ({ ...prev, search: q }))
  }, [searchParams])
  const [page, setPage] = useState(1)
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  const loadOrders = useCallback(() => {
    setLoading(true)
    api
      .get('/orders', { params: { ...filters, page } })
      .then(({ data }) => {
        setOrders(data.data)
        setMeta(data.meta)
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => {
    const timer = setTimeout(loadOrders, 250)
    return () => clearTimeout(timer)
  }, [loadOrders])

  async function openDetail(order) {
    try {
      const { data } = await api.get(`/orders/${order.id}`)
      setDetail(data.data)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function changeStatus(status) {
    const label = ORDER_STATUSES[status]
    if (status === 'dibatalkan' && !window.confirm('Batalkan transaksi ini? Stok akan dikembalikan.')) return
    try {
      const { data } = await api.patch(`/orders/${detail.id}/status`, { status })
      setDetail(data.data)
      toast.success(`Status diubah menjadi ${label}`)
      loadOrders()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const setFilter = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value })
    setPage(1)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Riwayat Transaksi</h1>
          <p className="muted">{isAdmin ? 'Seluruh transaksi kafe.' : 'Transaksi yang Anda buat.'}</p>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div className="search-box">
            <Icon name="search" />
            <input placeholder="Cari no. faktur / pemesan..." value={filters.search} onChange={setFilter('search')} />
          </div>
          <select value={filters.status} onChange={setFilter('status')}>
            <option value="">Semua Status</option>
            {Object.entries(ORDER_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input type="date" value={filters.from} onChange={setFilter('from')} aria-label="Dari tanggal" />
          <input type="date" value={filters.to} onChange={setFilter('to')} aria-label="Sampai tanggal" />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>No. Faktur</th>
                <th>Waktu</th>
                {isAdmin && <th>Kasir</th>}
                <th>Tipe</th>
                <th>Pemesan</th>
                <th>Bayar</th>
                <th className="right">Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="mono">{order.invoice_number}</td>
                  <td>{dateTime(order.created_at)}</td>
                  {isAdmin && <td>{order.user?.nama_lengkap}</td>}
                  <td>
                    {ORDER_TYPES[order.tipe_pesanan]}
                    {order.nomor_meja && ` · Meja ${order.nomor_meja}`}
                  </td>
                  <td>{order.nama_pemesan || '-'}</td>
                  <td>{PAYMENT_METHODS[order.metode_bayar]}</td>
                  <td className="right">{rupiah(order.grand_total)}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="actions">
                    <button className="btn btn-icon" onClick={() => openDetail(order)} title="Detail">
                      <Icon name="eye" size={16} />
                    </button>
                    <button className="btn btn-icon" onClick={() => window.open(`/orders/${order.id}/print`, '_blank')} title="Cetak">
                      <Icon name="print" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan="9" className="empty">
                    {loading ? 'Memuat...' : 'Tidak ada transaksi'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onChange={setPage} />
      </div>

      {detail && (
        <Modal
          wide
          title={`Detail ${detail.invoice_number}`}
          onClose={() => setDetail(null)}
          footer={
            <>
              {detail.status === 'diproses' && (
                <>
                  <button className="btn btn-danger-ghost" onClick={() => changeStatus('dibatalkan')}>
                    Batalkan
                  </button>
                  <button className="btn btn-success" onClick={() => changeStatus('selesai')}>
                    <Icon name="check" /> Tandai Selesai
                  </button>
                </>
              )}
              <button className="btn btn-outline" onClick={() => window.open(`/orders/${detail.id}/print`, '_blank')}>
                <Icon name="print" /> Cetak Struk
              </button>
            </>
          }
        >
          <div className="detail-grid">
            <div>
              <span className="muted">Waktu</span>
              {dateTime(detail.created_at)}
            </div>
            <div>
              <span className="muted">Kasir</span>
              {detail.user?.nama_lengkap}
            </div>
            <div>
              <span className="muted">Tipe</span>
              {ORDER_TYPES[detail.tipe_pesanan]}
              {detail.nomor_meja && ` · Meja ${detail.nomor_meja}`}
            </div>
            <div>
              <span className="muted">Pemesan</span>
              {detail.nama_pemesan || '-'}
            </div>
            <div>
              <span className="muted">Pembayaran</span>
              {PAYMENT_METHODS[detail.metode_bayar]}
            </div>
            <div>
              <span className="muted">Status</span>
              <StatusBadge status={detail.status} />
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Menu</th>
                  <th>Catatan</th>
                  <th className="right">Harga</th>
                  <th className="right">Qty</th>
                  <th className="right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nama_produk}</td>
                    <td className="muted">{item.catatan_khusus || '-'}</td>
                    <td className="right">{rupiah(item.harga_satuan)}</td>
                    <td className="right">{item.kuantiti}</td>
                    <td className="right">{rupiah(item.subtotal_baris)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals totals-compact">
            <div>
              <span>Subtotal</span>
              <span>{rupiah(detail.total_subtotal)}</span>
            </div>
            <div>
              <span>Diskon {detail.voucher_code && `(${detail.voucher_code})`}</span>
              <span>- {rupiah(detail.diskon_nominal)}</span>
            </div>
            <div>
              <span>Pajak PB1 (10%)</span>
              <span>{rupiah(detail.pajak_nominal)}</span>
            </div>
            <div className="grand">
              <span>Grand Total</span>
              <span>{rupiah(detail.grand_total)}</span>
            </div>
            <div>
              <span>Dibayar</span>
              <span>{rupiah(detail.uang_dibayar)}</span>
            </div>
            <div>
              <span>Kembalian</span>
              <span>{rupiah(detail.uang_kembali)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

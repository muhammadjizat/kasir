import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api, { errorMessage } from '../lib/api'
import { dateTime, ORDER_STATUSES, ORDER_TYPES, PAYMENT_METHODS, rupiah } from '../lib/format'
import Icon from '../components/Icon'

const PAPER_SIZES = {
  '58mm': { label: 'Thermal 58mm', page: '58mm auto', width: '48mm' },
  '80mm': { label: 'Thermal 80mm', page: '80mm auto', width: '72mm' },
  A4: { label: 'A4', page: 'A4', width: '180mm' },
}

export default function ReceiptPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [paper, setPaper] = useState(() => localStorage.getItem('receiptPaper') || '80mm')

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.data))
      .catch((err) => setError(errorMessage(err)))
  }, [id])

  function selectPaper(size) {
    setPaper(size)
    localStorage.setItem('receiptPaper', size)
  }

  if (error) return <div className="page-loading">{error}</div>
  if (!order) return <div className="page-loading">Memuat struk...</div>

  const size = PAPER_SIZES[paper]

  return (
    <div className="receipt-page">
      <style>{`@page { size: ${size.page}; margin: ${paper === 'A4' ? '15mm' : '3mm'}; }`}</style>

      <div className="receipt-toolbar no-print">
        <div className="segmented">
          {Object.entries(PAPER_SIZES).map(([key, value]) => (
            <button key={key} className={paper === key ? 'active' : ''} onClick={() => selectPaper(key)}>
              {value.label}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Icon name="print" /> Cetak
        </button>
      </div>

      <div className={`receipt receipt-${paper}`} style={{ width: size.width }}>
        <div className="receipt-head">
          <div className="receipt-title">TITIK TEMU KOPI</div>
          <div>Jl. Kenangan No. 12, Bandung</div>
          <div>Telp. 0812-3456-7890</div>
        </div>
        <div className="receipt-sep" />
        <div className="receipt-meta">
          <div>
            <span>No</span>
            <span>{order.invoice_number}</span>
          </div>
          <div>
            <span>Tanggal</span>
            <span>{dateTime(order.created_at)}</span>
          </div>
          <div>
            <span>Kasir</span>
            <span>{order.user?.nama_lengkap}</span>
          </div>
          <div>
            <span>Tipe</span>
            <span>
              {ORDER_TYPES[order.tipe_pesanan]}
              {order.nomor_meja && ` / Meja ${order.nomor_meja}`}
            </span>
          </div>
          {order.nama_pemesan && (
            <div>
              <span>Pemesan</span>
              <span>{order.nama_pemesan}</span>
            </div>
          )}
        </div>
        <div className="receipt-sep" />
        {order.items.map((item) => (
          <div className="receipt-item" key={item.id}>
            <div>{item.nama_produk}</div>
            <div className="receipt-line">
              <span>
                {item.kuantiti} x {rupiah(item.harga_satuan)}
              </span>
              <span>{rupiah(item.subtotal_baris)}</span>
            </div>
            {item.catatan_khusus && <div className="receipt-note">* {item.catatan_khusus}</div>}
          </div>
        ))}
        <div className="receipt-sep" />
        <div className="receipt-meta">
          <div>
            <span>Subtotal</span>
            <span>{rupiah(order.total_subtotal)}</span>
          </div>
          {Number(order.diskon_nominal) > 0 && (
            <div>
              <span>Diskon {order.voucher_code}</span>
              <span>-{rupiah(order.diskon_nominal)}</span>
            </div>
          )}
          <div>
            <span>PB1 10%</span>
            <span>{rupiah(order.pajak_nominal)}</span>
          </div>
          <div className="receipt-total">
            <span>TOTAL</span>
            <span>{rupiah(order.grand_total)}</span>
          </div>
          <div>
            <span>{PAYMENT_METHODS[order.metode_bayar]}</span>
            <span>{rupiah(order.uang_dibayar)}</span>
          </div>
          <div>
            <span>Kembali</span>
            <span>{rupiah(order.uang_kembali)}</span>
          </div>
        </div>
        <div className="receipt-sep" />
        <div className="receipt-foot">
          {order.status === 'dibatalkan' && <div className="receipt-void">*** {ORDER_STATUSES.dibatalkan.toUpperCase()} ***</div>}
          <div>Terima kasih atas kunjungan Anda</div>
          <div>Sampai bertemu di Titik Temu!</div>
        </div>
      </div>
    </div>
  )
}

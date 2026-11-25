import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../lib/api'
import { calculateDiscount, PAYMENT_METHODS, rupiah, TAX_RATE } from '../lib/format'
import { FALLBACK_PRODUCT_IMAGE, getProductImage } from '../lib/productImages'
import Icon from '../components/Icon'
import Modal from '../components/Modal'

const EMPTY_FORM = {
  tipe_pesanan: 'dine_in',
  nomor_meja: '',
  nama_pemesan: '',
  metode_bayar: 'tunai',
  uang_dibayar: '',
}

const CASH_SHORTCUTS = [50000, 100000, 150000, 200000]

export default function PosPage() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState(() => searchParams.get('q') || '')
  const [viewMode, setViewMode] = useState('grid')
  const [invoicePreview, setInvoicePreview] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [items, setItems] = useState([])
  const [voucherCode, setVoucherCode] = useState('')
  const [voucher, setVoucher] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [savedOrder, setSavedOrder] = useState(null)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q !== null) setSearch(q)
  }, [searchParams])

  function loadMasterData() {
    api.get('/products', { params: { status: 'aktif' } }).then(({ data }) => setProducts(data.data))
    api.get('/categories', { params: { status: 'aktif' } }).then(({ data }) => setCategories(data.data))
    api.get('/orders/next-invoice').then(({ data }) => setInvoicePreview(data.invoice_number))
  }

  useEffect(loadMasterData, [])

  const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])

  const visibleProducts = products.filter(
    (product) =>
      (activeCategory === 'all' || product.category_id === activeCategory) &&
      product.nama_produk.toLowerCase().includes(search.toLowerCase()),
  )

  // Kuantiti total per produk (satu produk bisa muncul di beberapa baris dengan catatan berbeda)
  const qtyByProduct = items.reduce((acc, item) => {
    if (item.product_id) acc[item.product_id] = (acc[item.product_id] || 0) + Number(item.qty || 0)
    return acc
  }, {})

  const subtotal = items.reduce((sum, item) => {
    const product = productById[item.product_id]
    return product ? sum + Number(product.harga_jual) * Number(item.qty || 0) : sum
  }, 0)
  const discount = calculateDiscount(voucher, subtotal)
  const tax = Math.round((subtotal - discount) * TAX_RATE)
  const grandTotal = subtotal - discount + tax
  const cashPaid = Number(form.uang_dibayar || 0)
  const change = form.metode_bayar === 'tunai' ? cashPaid - grandTotal : 0

  function addProduct(product) {
    if ((qtyByProduct[product.id] || 0) >= product.stok) {
      toast.error(`Stok ${product.nama_produk} tidak mencukupi`)
      return
    }
    const existingIndex = items.findIndex((item) => item.product_id === product.id && !item.catatan_khusus)
    if (existingIndex >= 0) {
      updateItem(existingIndex, 'qty', Number(items[existingIndex].qty) + 1)
    } else {
      setItems([...items, { product_id: product.id, qty: 1, catatan_khusus: '' }])
    }
  }

  function addEmptyRow() {
    setItems([...items, { product_id: '', qty: 1, catatan_khusus: '' }])
  }

  function updateItem(index, field, value) {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
    setErrors({ ...errors, items: undefined })
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function applyVoucher() {
    if (!voucherCode.trim()) return
    try {
      const { data } = await api.post('/vouchers/check', { kode: voucherCode.trim(), subtotal })
      setVoucher(data.voucher)
      toast.success(`Voucher ${data.voucher.kode} diterapkan`)
    } catch (error) {
      setVoucher(null)
      toast.error(errorMessage(error))
    }
  }

  function removeVoucher() {
    setVoucher(null)
    setVoucherCode('')
  }

  function validate() {
    const nextErrors = {}
    if (form.tipe_pesanan === 'dine_in' && !form.nomor_meja.trim()) nextErrors.nomor_meja = 'Nomor meja wajib diisi untuk Dine-In'
    if (!items.length) nextErrors.items = 'Tambahkan minimal satu item pesanan'
    else if (items.some((item) => !item.product_id)) nextErrors.items = 'Pilih menu pada setiap baris'
    else if (items.some((item) => Number(item.qty) < 1)) nextErrors.items = 'Kuantiti minimal 1'
    else {
      const overStock = Object.entries(qtyByProduct).find(([id, qty]) => qty > productById[id].stok)
      if (overStock) nextErrors.items = `Stok ${productById[overStock[0]].nama_produk} hanya ${productById[overStock[0]].stok}`
    }
    if (form.metode_bayar === 'tunai' && cashPaid < grandTotal)
      nextErrors.uang_dibayar = 'Nominal pembayaran kurang dari total tagihan'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) {
      toast.error('Periksa kembali form transaksi')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await api.post('/orders', {
        ...form,
        nomor_meja: form.tipe_pesanan === 'dine_in' ? form.nomor_meja : null,
        uang_dibayar: form.metode_bayar === 'tunai' ? cashPaid : grandTotal,
        voucher_code: voucher?.kode || null,
        items: items.map((item) => ({ ...item, qty: Number(item.qty) })),
      })
      setSavedOrder(data.data)
      toast.success(`Transaksi ${data.data.invoice_number} berhasil disimpan`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  function resetTransaction() {
    setSavedOrder(null)
    setForm(EMPTY_FORM)
    setItems([])
    removeVoucher()
    setErrors({})
    loadMasterData()
  }

  function clearCart() {
    setItems([])
    removeVoucher()
    setErrors({})
  }

  const setField = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value })
    setErrors({ ...errors, [field]: undefined })
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Kasir & Pemesanan</h1>
          <p className="muted">
            No. Faktur: <span className="mono strong">{invoicePreview || '...'}</span>
            <span className="hint"> (final ditetapkan saat disimpan)</span>
          </p>
        </div>
      </div>

      <div className="pos-layout">
        {/* Panel Kiri: Pesanan Saat Ini (Current Sale) */}
        <section className="card pos-cart">
          <div className="cart-title-bar">
            <h2>Pesanan Saat Ini</h2>
            <span className="cart-invoice-pill">{invoicePreview || '...'}</span>
          </div>

          <div className="segmented">
            {[
              ['dine_in', 'Dine-In'],
              ['takeaway', 'Takeaway'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={form.tipe_pesanan === value ? 'active' : ''}
                onClick={() => setForm({ ...form, tipe_pesanan: value })}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="form-row">
            {form.tipe_pesanan === 'dine_in' && (
              <div className="field">
                <label>No. Meja *</label>
                <input
                  className={errors.nomor_meja ? 'invalid' : ''}
                  value={form.nomor_meja}
                  onChange={setField('nomor_meja')}
                  placeholder="mis. 05"
                />
                {errors.nomor_meja && <div className="field-error">{errors.nomor_meja}</div>}
              </div>
            )}
            <div className="field grow">
              <label>Nama Pemesan / Catatan Meja</label>
              <input value={form.nama_pemesan} onChange={setField('nama_pemesan')} placeholder="mis. Budi" />
            </div>
          </div>

          <div className="cart-header">
            <h3>Item Pesanan ({items.length})</h3>
            <button className="btn btn-sm btn-outline" onClick={addEmptyRow}>
              <Icon name="plus" size={14} /> Tambah Baris
            </button>
          </div>

          <div className="cart-items">
            {items.map((item, index) => {
              const product = productById[item.product_id]
              return (
                <div className="cart-row" key={index}>
                  {product ? (
                    <div className="cart-row-main">
                      <img
                        className="cart-thumb"
                        src={getProductImage(product)}
                        alt={product.nama_produk}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE
                        }}
                      />
                      <div className="cart-item-meta">
                        <div className="cart-item-name">{product.nama_produk}</div>
                        <div className="cart-item-unit-price">{rupiah(product.harga_jual)}</div>
                      </div>
                      <button className="btn btn-icon btn-danger-ghost" onClick={() => removeItem(index)} aria-label="Hapus item">
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="cart-row-top">
                      <select value={item.product_id} onChange={(e) => updateItem(index, 'product_id', Number(e.target.value) || '')}>
                        <option value="">-- Pilih menu --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stok <= 0}>
                            {p.nama_produk} ({rupiah(p.harga_jual)}) — stok {p.stok}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-icon btn-danger-ghost" onClick={() => removeItem(index)} aria-label="Hapus item">
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  )}

                  <div className="cart-row-bottom">
                    <div className="qty-control">
                      <button onClick={() => updateItem(index, 'qty', Math.max(1, Number(item.qty) - 1))}>
                        <Icon name="minus" size={14} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', e.target.value)}
                      />
                      <button onClick={() => updateItem(index, 'qty', Number(item.qty) + 1)}>
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                    <input
                      className="note-input"
                      placeholder="Catatan (Less Sugar, Extra Ice...)"
                      value={item.catatan_khusus}
                      onChange={(e) => updateItem(index, 'catatan_khusus', e.target.value)}
                    />
                    <div className="line-total">{product ? rupiah(product.harga_jual * Number(item.qty || 0)) : '-'}</div>
                  </div>
                </div>
              )
            })}
            {!items.length && <div className="empty">Klik menu di sebelah kanan untuk menambahkan item</div>}
          </div>
          {errors.items && <div className="field-error">{errors.items}</div>}

          <div className="voucher-row">
            {voucher ? (
              <div className="voucher-applied">
                <span>
                  <Icon name="vouchers" size={16} /> {voucher.kode} — {voucher.nama}
                  {subtotal < Number(voucher.min_belanja) && (
                    <span className="field-error"> (min. belanja {rupiah(voucher.min_belanja)})</span>
                  )}
                </span>
                <button className="link" onClick={removeVoucher}>
                  Hapus
                </button>
              </div>
            ) : (
              <>
                <input
                  placeholder="Kode voucher (opsional)"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                />
                <button className="btn btn-outline" onClick={applyVoucher} disabled={!voucherCode}>
                  Terapkan
                </button>
              </>
            )}
          </div>

          <div className="totals">
            <div>
              <span>Subtotal</span>
              <span>{rupiah(subtotal)}</span>
            </div>
            <div>
              <span>Diskon</span>
              <span className="text-red">- {rupiah(discount)}</span>
            </div>
            <div>
              <span>Pajak PB1 (10%)</span>
              <span>{rupiah(tax)}</span>
            </div>
            <div className="grand">
              <span>Total</span>
              <span>{rupiah(grandTotal)}</span>
            </div>
          </div>

          <div className="field">
            <label>Metode Pembayaran</label>
            <div className="pay-methods">
              {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                <button
                  key={value}
                  className={form.metode_bayar === value ? 'active' : ''}
                  onClick={() => {
                    setForm({ ...form, metode_bayar: value })
                    setErrors({ ...errors, uang_dibayar: undefined })
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.metode_bayar === 'tunai' && (
            <div className="field">
              <label>Uang Diterima</label>
              <input
                type="number"
                min="0"
                className={errors.uang_dibayar ? 'invalid' : ''}
                value={form.uang_dibayar}
                onChange={setField('uang_dibayar')}
                placeholder="0"
              />
              <div className="chips cash-chips">
                <button className="chip" onClick={() => setForm({ ...form, uang_dibayar: String(grandTotal) })}>
                  Uang Pas
                </button>
                {CASH_SHORTCUTS.filter((amount) => amount >= grandTotal).map((amount) => (
                  <button key={amount} className="chip" onClick={() => setForm({ ...form, uang_dibayar: String(amount) })}>
                    {rupiah(amount)}
                  </button>
                ))}
              </div>
              {errors.uang_dibayar && <div className="field-error">{errors.uang_dibayar}</div>}
              <div className={`change ${change < 0 ? 'negative' : ''}`}>
                <span>Kembalian</span>
                <span>{change < 0 ? `Kurang ${rupiah(-change)}` : rupiah(change)}</span>
              </div>
            </div>
          )}

          <div className="cart-actions-row">
            <button
              type="button"
              className="btn btn-outline btn-lg"
              onClick={clearCart}
              disabled={!items.length || submitting}
            >
              Kosongkan
            </button>
            <button className="btn btn-primary btn-lg btn-pay" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Menyimpan...' : `Bayar ${rupiah(grandTotal)}`}
            </button>
          </div>
        </section>

        {/* Panel Kanan: Katalog Produk dengan Foto */}
        <section className="card pos-menu">
          <div className="pos-toolbar">
            <div className="pos-toolbar-top">
              <div className="chips">
                <button className={`chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>
                  Semua
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`chip ${activeCategory === category.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.nama_kategori}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => setViewMode((m) => (m === 'grid' ? 'list' : 'grid'))}
                title={viewMode === 'grid' ? 'Tampilan Daftar' : 'Tampilan Grid'}
                aria-label="Ubah tampilan katalog"
              >
                <Icon name={viewMode === 'grid' ? 'list' : 'grid'} size={18} />
              </button>
            </div>

            <div className="search-box">
              <Icon name="search" />
              <input placeholder="Cari menu kopi, makanan, atau pastry..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className={`product-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {visibleProducts.map((product) => {
              const remaining = product.stok - (qtyByProduct[product.id] || 0)
              return (
                <button
                  key={product.id}
                  className={`product-card ${remaining <= 0 ? 'disabled' : ''}`}
                  onClick={() => addProduct(product)}
                  disabled={remaining <= 0}
                >
                  <div className="product-thumb-wrap">
                    <img
                      className="product-thumb"
                      src={getProductImage(product)}
                      alt={product.nama_produk}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE
                      }}
                    />
                    <span className={`product-stock-badge ${remaining <= product.stok_minimum ? 'low' : ''}`}>
                      {remaining <= 0 ? 'Habis' : `Sisa ${remaining}`}
                    </span>
                  </div>
                  <div className="product-info-col">
                    <div className="product-cat">{product.category?.nama_kategori}</div>
                    <div className="product-name">{product.nama_produk}</div>
                    <div className="product-bottom">
                      <div className="product-price">{rupiah(product.harga_jual)}</div>
                      <span className="product-add-btn" aria-hidden="true">
                        <Icon name="plus" size={16} />
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
            {!visibleProducts.length && <div className="empty">Menu tidak ditemukan</div>}
          </div>
        </section>
      </div>

      {savedOrder && (
        <Modal
          title="Transaksi Berhasil"
          onClose={resetTransaction}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => window.open(`/orders/${savedOrder.id}/print`, '_blank')}>
                <Icon name="print" /> Cetak Struk
              </button>
              <button className="btn btn-primary" onClick={resetTransaction}>
                Transaksi Baru
              </button>
            </>
          }
        >
          <div className="success-box">
            <div className="success-terminal">
              <div className="success-icon">
                <Icon name="check" size={30} />
              </div>
              <div className="success-label">Pembayaran Berhasil</div>
              <div className="success-total">{rupiah(savedOrder.grand_total)}</div>
              <div className="success-invoice mono">{savedOrder.invoice_number}</div>
            </div>
            <div className="muted">
              {PAYMENT_METHODS[savedOrder.metode_bayar]}
              {savedOrder.metode_bayar === 'tunai' && ` · Kembalian ${rupiah(savedOrder.uang_kembali)}`}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { rupiah } from '../lib/format'
import { FALLBACK_PRODUCT_IMAGE, getProductImage } from '../lib/productImages'
import CrudPage from '../components/CrudPage'

export default function ProductsPage() {
  const [categories, setCategories] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const params = useMemo(() => ({ category_id: categoryFilter }), [categoryFilter])

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data))
  }, [])

  return (
    <CrudPage
      title="Menu & Stok"
      subtitle="Kelola menu, harga jual, harga pokok, dan stok."
      endpoint="/products"
      itemName="Menu"
      params={params}
      toolbar={
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nama_kategori}
            </option>
          ))}
        </select>
      }
      defaults={{
        category_id: '',
        kode_produk: '',
        nama_produk: '',
        harga_jual: '',
        harga_pokok: '',
        stok: 0,
        stok_minimum: 5,
        unit: 'cup',
        status: 'aktif',
      }}
      columns={[
        { key: 'kode_produk', label: 'Kode', render: (row) => <span className="mono">{row.kode_produk}</span> },
        {
          key: 'nama_produk',
          label: 'Nama Menu',
          render: (row) => (
            <div className="table-product-cell">
              <img
                className="table-product-thumb"
                src={getProductImage(row)}
                alt={row.nama_produk}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_PRODUCT_IMAGE
                }}
              />
              <span className="strong">{row.nama_produk}</span>
            </div>
          ),
        },
        { key: 'category', label: 'Kategori', render: (row) => row.category?.nama_kategori },
        { key: 'harga_pokok', label: 'Harga Pokok', align: 'right', render: (row) => rupiah(row.harga_pokok) },
        { key: 'harga_jual', label: 'Harga Jual', align: 'right', render: (row) => rupiah(row.harga_jual) },
        {
          key: 'stok',
          label: 'Stok',
          align: 'right',
          render: (row) => (
            <span className={`stock-pill ${row.stok <= row.stok_minimum ? (row.stok === 0 ? 'out' : 'low') : 'ok'}`}>
              {row.stok} {row.unit}
            </span>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          render: (row) => <span className={`badge badge-${row.status}`}>{row.status}</span>,
        },
      ]}
      fields={[
        { name: 'kode_produk', label: 'Kode Produk', required: true },
        {
          name: 'category_id',
          label: 'Kategori',
          type: 'select',
          required: true,
          placeholder: '-- Pilih kategori --',
          options: categories.map((c) => ({ value: c.id, label: c.nama_kategori })),
        },
        { name: 'nama_produk', label: 'Nama Menu', required: true, full: true },
        { name: 'harga_pokok', label: 'Harga Pokok (HPP)', type: 'number', required: true },
        { name: 'harga_jual', label: 'Harga Jual', type: 'number', required: true },
        { name: 'stok', label: 'Stok', type: 'number', required: true },
        { name: 'stok_minimum', label: 'Batas Minimum Stok', type: 'number', required: true },
        { name: 'unit', label: 'Satuan', required: true },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'aktif', label: 'Aktif (tampil di kasir)' },
            { value: 'nonaktif', label: 'Nonaktif' },
          ],
        },
      ]}
    />
  )
}

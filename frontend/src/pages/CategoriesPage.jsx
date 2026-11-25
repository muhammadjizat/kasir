import CrudPage from '../components/CrudPage'

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
]

export default function CategoriesPage() {
  return (
    <CrudPage
      title="Kategori Menu"
      subtitle="Kelompokkan menu makanan & minuman."
      endpoint="/categories"
      itemName="Kategori"
      defaults={{ nama_kategori: '', status: 'aktif' }}
      columns={[
        { key: 'nama_kategori', label: 'Nama Kategori' },
        { key: 'slug', label: 'Slug', render: (row) => <span className="mono">{row.slug}</span> },
        { key: 'products_count', label: 'Jumlah Menu', align: 'right' },
        {
          key: 'status',
          label: 'Status',
          render: (row) => <span className={`badge badge-${row.status}`}>{row.status}</span>,
        },
      ]}
      fields={[
        { name: 'nama_kategori', label: 'Nama Kategori', required: true, full: true },
        { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}

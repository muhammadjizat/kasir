import { rupiah } from '../lib/format'
import CrudPage from '../components/CrudPage'

export default function VouchersPage() {
  return (
    <CrudPage
      title="Voucher Diskon"
      subtitle="Kode promo yang dapat diterapkan kasir saat transaksi."
      endpoint="/vouchers"
      itemName="Voucher"
      defaults={{ kode: '', nama: '', tipe: 'persen', nilai: '', min_belanja: 0, maks_diskon: '', status: 'aktif' }}
      columns={[
        { key: 'kode', label: 'Kode', render: (row) => <span className="mono strong">{row.kode}</span> },
        { key: 'nama', label: 'Nama Promo' },
        {
          key: 'nilai',
          label: 'Potongan',
          render: (row) => (row.tipe === 'persen' ? `${Number(row.nilai)}%` : rupiah(row.nilai)),
        },
        { key: 'min_belanja', label: 'Min. Belanja', align: 'right', render: (row) => rupiah(row.min_belanja) },
        {
          key: 'maks_diskon',
          label: 'Maks. Diskon',
          align: 'right',
          render: (row) => (row.maks_diskon ? rupiah(row.maks_diskon) : '-'),
        },
        {
          key: 'status',
          label: 'Status',
          render: (row) => <span className={`badge badge-${row.status}`}>{row.status}</span>,
        },
      ]}
      fields={[
        { name: 'kode', label: 'Kode Voucher', required: true },
        { name: 'nama', label: 'Nama Promo', required: true },
        {
          name: 'tipe',
          label: 'Tipe Potongan',
          type: 'select',
          options: [
            { value: 'persen', label: 'Persentase (%)' },
            { value: 'nominal', label: 'Nominal (Rp)' },
          ],
        },
        { name: 'nilai', label: 'Nilai Potongan', type: 'number', required: true },
        { name: 'min_belanja', label: 'Minimum Belanja', type: 'number' },
        { name: 'maks_diskon', label: 'Maksimum Diskon (opsional)', type: 'number' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'aktif', label: 'Aktif' },
            { value: 'nonaktif', label: 'Nonaktif' },
          ],
        },
      ]}
    />
  )
}

import { dateTime } from '../lib/format'
import CrudPage from '../components/CrudPage'

export default function UsersPage() {
  return (
    <CrudPage
      title="Pengguna"
      subtitle="Kelola akun administrator dan kasir."
      endpoint="/users"
      itemName="Pengguna"
      defaults={{ nama_lengkap: '', username: '', email: '', password: '', role: 'kasir', status: 'aktif' }}
      columns={[
        { key: 'nama_lengkap', label: 'Nama Lengkap' },
        { key: 'username', label: 'Username', render: (row) => <span className="mono">{row.username}</span> },
        { key: 'email', label: 'Email' },
        {
          key: 'role',
          label: 'Role',
          render: (row) => <span className={`badge badge-role-${row.role}`}>{row.role === 'admin' ? 'Admin' : 'Kasir'}</span>,
        },
        {
          key: 'status',
          label: 'Status',
          render: (row) => <span className={`badge badge-${row.status}`}>{row.status}</span>,
        },
        { key: 'created_at', label: 'Dibuat', render: (row) => dateTime(row.created_at) },
      ]}
      fields={[
        { name: 'nama_lengkap', label: 'Nama Lengkap', required: true, full: true },
        { name: 'username', label: 'Username', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'password', label: 'Password', type: 'password', help: 'Kosongkan jika tidak ingin mengubah password' },
        {
          name: 'role',
          label: 'Role',
          type: 'select',
          options: [
            { value: 'kasir', label: 'Kasir / Waiter' },
            { value: 'admin', label: 'Administrator / Manager' },
          ],
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'aktif', label: 'Aktif' },
            { value: 'nonaktif', label: 'Nonaktif (tidak bisa login)' },
          ],
        },
      ]}
    />
  )
}

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../lib/api'
import Icon from './Icon'
import Modal from './Modal'

/**
 * Halaman master data generik: tabel + pencarian + form tambah/ubah dalam modal.
 * `fields` mendefinisikan input form, `columns` mendefinisikan kolom tabel.
 */
export default function CrudPage({ title, subtitle, endpoint, columns, fields, defaults, itemName, toolbar, params }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaults)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api
      .get(endpoint, { params: { search, ...params } })
      .then(({ data }) => setRows(data.data))
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [endpoint, search, params])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  function openCreate() {
    setForm(defaults)
    setErrors({})
    setEditing('new')
  }

  function openEdit(row) {
    const values = {}
    fields.forEach((field) => {
      values[field.name] = field.type === 'password' ? '' : (row[field.name] ?? '')
    })
    setForm(values)
    setErrors({})
    setEditing(row)
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editing === 'new') await api.post(endpoint, form)
      else await api.put(`${endpoint}/${editing.id}`, form)
      toast.success(`${itemName} berhasil ${editing === 'new' ? 'ditambahkan' : 'diperbarui'}`)
      setEditing(null)
      load()
    } catch (error) {
      setErrors(Object.fromEntries(Object.entries(error.response?.data?.errors || {}).map(([k, v]) => [k, v[0]])))
      toast.error(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Hapus ${itemName.toLowerCase()} ini?`)) return
    try {
      const { data } = await api.delete(`${endpoint}/${row.id}`)
      toast.success(data.message || `${itemName} berhasil dihapus`)
      load()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  function renderInput(field) {
    const common = {
      id: field.name,
      value: form[field.name] ?? '',
      className: errors[field.name] ? 'invalid' : '',
      onChange: (event) => {
        setForm({ ...form, [field.name]: event.target.value })
        setErrors({ ...errors, [field.name]: undefined })
      },
    }
    if (field.type === 'select') {
      return (
        <select {...common}>
          {field.placeholder && <option value="">{field.placeholder}</option>}
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }
    return <input type={field.type || 'text'} min={field.type === 'number' ? 0 : undefined} step={field.step} {...common} />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Icon name="plus" /> Tambah {itemName}
        </button>
      </div>

      <div className="card">
        <div className="filters">
          <div className="search-box">
            <Icon name="search" />
            <input placeholder={`Cari ${itemName.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {toolbar}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={column.align}>
                    {column.label}
                  </th>
                ))}
                <th className="right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key} className={column.align}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                  <td className="actions right">
                    <button className="btn btn-icon" onClick={() => openEdit(row)} title="Ubah">
                      <Icon name="edit" size={16} />
                    </button>
                    <button className="btn btn-icon btn-danger-ghost" onClick={() => handleDelete(row)} title="Hapus">
                      <Icon name="trash" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={columns.length + 1} className="empty">
                    {loading ? 'Memuat...' : 'Belum ada data'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal
          title={`${editing === 'new' ? 'Tambah' : 'Ubah'} ${itemName}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                Batal
              </button>
              <button className="btn btn-primary" form="crud-form" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </>
          }
        >
          <form id="crud-form" className="form-grid" onSubmit={handleSave}>
            {fields.map((field) => (
              <div key={field.name} className={`field ${field.full ? 'full' : ''}`}>
                <label htmlFor={field.name}>
                  {field.label}
                  {field.required && ' *'}
                </label>
                {renderInput(field)}
                {field.help && editing !== 'new' && <div className="hint">{field.help}</div>}
                {errors[field.name] && <div className="field-error">{errors[field.name]}</div>}
              </div>
            ))}
          </form>
        </Modal>
      )}
    </div>
  )
}

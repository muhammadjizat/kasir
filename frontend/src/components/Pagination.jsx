export default function Pagination({ meta, onChange }) {
  if (!meta || meta.last_page <= 1) return null
  return (
    <div className="pagination">
      <span className="muted">
        Halaman {meta.current_page} dari {meta.last_page} · {meta.total} data
      </span>
      <div>
        <button className="btn btn-sm btn-outline" disabled={meta.current_page <= 1} onClick={() => onChange(meta.current_page - 1)}>
          Sebelumnya
        </button>
        <button
          className="btn btn-sm btn-outline"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onChange(meta.current_page + 1)}
        >
          Berikutnya
        </button>
      </div>
    </div>
  )
}

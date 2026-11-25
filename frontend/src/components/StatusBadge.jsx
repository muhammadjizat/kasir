import { ORDER_STATUSES } from '../lib/format'

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{ORDER_STATUSES[status] || status}</span>
}

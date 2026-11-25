export const TAX_RATE = 0.1

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export const rupiah = (value) => rupiahFormatter.format(Number(value) || 0)

export const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'

export const todayISO = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

export const daysAgoISO = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

export const PAYMENT_METHODS = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer Bank',
  debit: 'Kartu Debit',
}

export const ORDER_TYPES = {
  dine_in: 'Dine-In',
  takeaway: 'Takeaway',
}

export const ORDER_STATUSES = {
  diproses: 'Diproses',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
}

// Harus sama dengan perhitungan di backend (App\Services\OrderService)
export function calculateDiscount(voucher, subtotal) {
  if (!voucher || subtotal < Number(voucher.min_belanja)) return 0
  let discount =
    voucher.tipe === 'persen' ? Math.round((subtotal * Number(voucher.nilai)) / 100) : Number(voucher.nilai)
  if (voucher.maks_diskon && Number(voucher.maks_diskon) > 0) discount = Math.min(discount, Number(voucher.maks_diskon))
  return Math.min(discount, subtotal)
}

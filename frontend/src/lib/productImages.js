const CODE_IMAGE_MAP = {
  'CF-001': '/images/products/cf-001.jpg',
  'CF-002': '/images/products/cf-002.jpg',
  'CF-003': '/images/products/cf-003.jpg',
  'CF-004': '/images/products/cf-004.jpg',
  'CF-005': '/images/products/cf-005.jpg',
  'CF-006': '/images/products/cf-006.jpg',
  'NC-001': '/images/products/nc-001.jpg',
  'NC-002': '/images/products/nc-002.jpg',
  'NC-003': '/images/products/nc-003.jpg',
  'NC-004': '/images/products/nc-004.jpg',
  'FD-001': '/images/products/fd-001.jpg',
  'FD-002': '/images/products/fd-002.jpg',
  'FD-003': '/images/products/fd-003.jpg',
  'FD-004': '/images/products/fd-004.jpg',
  'PS-001': '/images/products/ps-001.jpg',
  'PS-002': '/images/products/ps-002.jpg',
  'PS-003': '/images/products/ps-003.jpg',
  'PS-004': '/images/products/ps-004.jpg',
}

const KEYWORD_IMAGE_MAP = [
  ['espresso', '/images/products/cf-001.jpg'],
  ['americano', '/images/products/cf-002.jpg'],
  ['cappuccino', '/images/products/cf-003.jpg'],
  ['gula aren', '/images/products/cf-005.jpg'],
  ['kopi susu', '/images/products/cf-005.jpg'],
  ['vanilla', '/images/products/cf-006.jpg'],
  ['matcha', '/images/products/nc-001.jpg'],
  ['red velvet', '/images/products/nc-002.jpg'],
  ['velvet', '/images/products/nc-002.jpg'],
  ['pain au chocolat', '/images/products/ps-002.jpg'],
  ['chocolate', '/images/products/nc-003.jpg'],
  ['coklat', '/images/products/nc-003.jpg'],
  ['latte', '/images/products/cf-004.jpg'],
  ['lemon', '/images/products/nc-004.jpg'],
  ['tea', '/images/products/nc-004.jpg'],
  ['teh', '/images/products/nc-004.jpg'],
  ['nasi', '/images/products/fd-001.jpg'],
  ['mie', '/images/products/fd-002.jpg'],
  ['katsu', '/images/products/fd-003.jpg'],
  ['fries', '/images/products/fd-004.jpg'],
  ['kentang', '/images/products/fd-004.jpg'],
  ['croissant', '/images/products/ps-001.jpg'],
  ['cinnamon', '/images/products/ps-003.jpg'],
  ['banana', '/images/products/ps-004.jpg'],
]

const CATEGORY_FALLBACK = {
  coffee: '/images/products/cf-003.jpg',
  'non-coffee': '/images/products/nc-001.jpg',
  food: '/images/products/fd-001.jpg',
  pastry: '/images/products/ps-001.jpg',
}

export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
      <rect width="120" height="120" rx="16" fill="#E6F6F4"/>
      <path d="M36 50h36v22a14 14 0 0 1-14 14h-8a14 14 0 0 1-14-14V50Z" stroke="#2A9D92" stroke-width="4" stroke-linejoin="round"/>
      <path d="M72 54h6a8 8 0 0 1 0 16h-6" stroke="#2A9D92" stroke-width="4" stroke-linecap="round"/>
      <path d="M46 34v8M54 31v11M62 34v8" stroke="#2A9D92" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  )

export function getProductImage(product) {
  if (!product) return FALLBACK_PRODUCT_IMAGE
  if (product.gambar) return product.gambar

  const code = String(product.kode_produk || '').toUpperCase()
  if (CODE_IMAGE_MAP[code]) return CODE_IMAGE_MAP[code]

  const name = String(product.nama_produk || '').toLowerCase()
  const matched = KEYWORD_IMAGE_MAP.find(([kw]) => name.includes(kw))
  if (matched) return matched[1]

  const cat = String(product.category?.nama_kategori || '').toLowerCase()
  if (CATEGORY_FALLBACK[cat]) return CATEGORY_FALLBACK[cat]

  return '/images/products/cf-003.jpg'
}

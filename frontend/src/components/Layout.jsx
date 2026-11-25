import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/pos', label: 'Transaksi Baru', icon: 'pos' },
  { to: '/orders', label: 'Riwayat Transaksi', icon: 'orders' },
  { to: '/reports', label: 'Laporan', icon: 'reports', admin: true },
  { section: 'Master Data', admin: true },
  { to: '/products', label: 'Menu & Stok', icon: 'products', admin: true },
  { to: '/categories', label: 'Kategori', icon: 'categories', admin: true },
  { to: '/vouchers', label: 'Voucher', icon: 'vouchers', admin: true },
  { to: '/users', label: 'Pengguna', icon: 'users', admin: true },
]

export default function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [quickQuery, setQuickQuery] = useState('')
  const searchInputRef = useRef(null)

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function handleLogout() {
    await logout()
    toast.success('Anda telah keluar')
    navigate('/login', { replace: true })
  }

  function handleMenuButton() {
    if (window.innerWidth <= 860) setSidebarOpen((open) => !open)
    else setCollapsed((prev) => !prev)
  }

  function handleQuickSearch(event) {
    event.preventDefault()
    const query = quickQuery.trim()
    if (!query) return
    if (query.toUpperCase().startsWith('INV')) {
      navigate(`/orders?search=${encodeURIComponent(query)}`)
    } else {
      navigate(`/pos?q=${encodeURIComponent(query)}`)
    }
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.admin || isAdmin)

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-logo">
            <Icon name="bag" size={20} />
          </div>
          <div className="brand-text">
            <div className="brand-name">Titik Temu Kopi</div>
            <div className="brand-sub">Point of Sales</div>
          </div>
        </div>

        <nav className="nav">
          {visibleItems.map((item) =>
            item.section ? (
              <div key={item.section} className="nav-section">
                {item.section}
              </div>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)} title={item.label}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>

        <button
          type="button"
          className="sidebar-help"
          onClick={() => toast('Shortcut: tekan Ctrl+K untuk cari menu atau nomor faktur dengan cepat.')}
          title="Butuh Bantuan?"
        >
          <div className="sidebar-help-icon">
            <Icon name="help" size={16} />
          </div>
          <div className="sidebar-help-text">
            <div className="sidebar-help-title">Butuh Bantuan?</div>
            <div className="sidebar-help-sub">Panduan & pintasan kasir</div>
          </div>
        </button>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{user.nama_lengkap.charAt(0)}</div>
            <div className="user-meta">
              <div className="user-name">{user.nama_lengkap}</div>
              <div className="user-role">{user.role === 'admin' ? 'Administrator' : 'Kasir'}</div>
            </div>
          </div>
          <button className="btn sidebar-logout btn-block" onClick={handleLogout} title="Keluar">
            <Icon name="logout" size={16} />
            <span className="sidebar-logout-label">Keluar</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn btn-icon menu-toggle" onClick={handleMenuButton} aria-label="Buka atau lipat menu">
              <Icon name="menu" />
            </button>
            <div>
              <div className="topbar-greeting">Selamat datang, {user.nama_lengkap}! 👋</div>
              <div className="topbar-sub">
                {isAdmin ? 'Pantau penjualan dan operasional kafe hari ini.' : 'Siap melayani pesanan pelanggan hari ini.'}
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <form className="topbar-search" onSubmit={handleQuickSearch}>
              <Icon name="search" size={15} />
              <input
                ref={searchInputRef}
                placeholder="Cari menu atau no. faktur..."
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                aria-label="Pencarian cepat"
              />
              <span className="topbar-search-kbd">Ctrl K</span>
            </form>
            <Link to="/orders" className="topbar-action-btn" title="Riwayat Transaksi">
              <Icon name="bell" size={18} />
            </Link>
            <Link to="/pos" className="topbar-action-btn" title="Buka Kasir (POS)">
              <Icon name="cart" size={18} />
            </Link>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

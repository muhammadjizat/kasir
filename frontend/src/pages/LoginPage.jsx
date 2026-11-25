import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ login: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  function validate() {
    const nextErrors = {}
    if (!form.login.trim()) nextErrors.login = 'Username atau email wajib diisi'
    if (!form.password) nextErrors.password = 'Password wajib diisi'
    else if (form.password.length < 6) nextErrors.password = 'Password minimal 6 karakter'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const loggedInUser = await login(form.login.trim(), form.password)
      toast.success(`Selamat datang, ${loggedInUser.nama_lengkap}`)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (error) {
      const serverErrors = error.response?.data?.errors
      if (serverErrors) setErrors({ login: serverErrors.login?.[0], password: serverErrors.password?.[0] })
      toast.error(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value })
    setErrors({ ...errors, [field]: undefined })
  }

  return (
    <div className="login-page">
      {/* Panel Kiri */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-wrap">
            <div className="login-logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M16 12V6M12 8l4-4 4 4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="6" y="20" width="20" height="3" rx="1.5" fill="#fff" fillOpacity="0.8"/>
                <rect x="8" y="23" width="16" height="2" rx="1" fill="#fff" fillOpacity="0.5"/>
              </svg>
            </div>
            <div>
              <div className="login-brand-name">Titik Temu Kopi</div>
              <div className="login-brand-sub">Sistem Kasir & Pemesanan</div>
            </div>
          </div>

          {/* Ilustrasi POS */}
          <div className="login-illustration">
            <svg viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Monitor */}
              <rect x="40" y="20" width="240" height="160" rx="12" fill="white" fillOpacity="0.15"/>
              <rect x="40" y="20" width="240" height="160" rx="12" stroke="white" strokeOpacity="0.3" strokeWidth="1.5"/>
              {/* Screen content */}
              <rect x="52" y="32" width="216" height="136" rx="6" fill="white" fillOpacity="0.1"/>
              {/* Sidebar inside monitor */}
              <rect x="52" y="32" width="52" height="136" rx="6" fill="white" fillOpacity="0.15"/>
              <rect x="60" y="44" width="36" height="6" rx="3" fill="white" fillOpacity="0.7"/>
              <rect x="60" y="58" width="28" height="4" rx="2" fill="white" fillOpacity="0.4"/>
              <rect x="60" y="68" width="32" height="4" rx="2" fill="white" fillOpacity="0.4"/>
              <rect x="60" y="78" width="30" height="4" rx="2" fill="white" fillOpacity="0.4"/>
              <rect x="60" y="88" width="28" height="4" rx="2" fill="white" fillOpacity="0.4"/>
              {/* KPI cards */}
              <rect x="114" y="38" width="46" height="28" rx="5" fill="white" fillOpacity="0.2"/>
              <rect x="166" y="38" width="46" height="28" rx="5" fill="white" fillOpacity="0.2"/>
              <rect x="218" y="38" width="42" height="28" rx="5" fill="white" fillOpacity="0.2"/>
              <rect x="118" y="43" width="20" height="3" rx="1.5" fill="white" fillOpacity="0.5"/>
              <rect x="118" y="50" width="30" height="5" rx="2" fill="white" fillOpacity="0.8"/>
              <rect x="170" y="43" width="20" height="3" rx="1.5" fill="white" fillOpacity="0.5"/>
              <rect x="170" y="50" width="30" height="5" rx="2" fill="white" fillOpacity="0.8"/>
              <rect x="222" y="43" width="20" height="3" rx="1.5" fill="white" fillOpacity="0.5"/>
              <rect x="222" y="50" width="28" height="5" rx="2" fill="white" fillOpacity="0.8"/>
              {/* Product grid */}
              <rect x="114" y="74" width="58" height="40" rx="5" fill="white" fillOpacity="0.15"/>
              <rect x="178" y="74" width="58" height="40" rx="5" fill="white" fillOpacity="0.15"/>
              <rect x="114" y="120" width="58" height="40" rx="5" fill="white" fillOpacity="0.15"/>
              <rect x="178" y="120" width="58" height="40" rx="5" fill="white" fillOpacity="0.15"/>
              {/* Product icons (coffee cups) */}
              <circle cx="143" cy="89" r="10" fill="white" fillOpacity="0.3"/>
              <circle cx="207" cy="89" r="10" fill="white" fillOpacity="0.3"/>
              <circle cx="143" cy="135" r="10" fill="white" fillOpacity="0.3"/>
              <circle cx="207" cy="135" r="10" fill="white" fillOpacity="0.3"/>
              {/* Monitor stand */}
              <rect x="148" y="180" width="24" height="12" rx="2" fill="white" fillOpacity="0.2"/>
              <rect x="136" y="192" width="48" height="6" rx="3" fill="white" fillOpacity="0.3"/>
              {/* POS Terminal kanan bawah */}
              <rect x="250" y="170" width="52" height="70" rx="8" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.3" strokeWidth="1"/>
              <rect x="256" y="178" width="40" height="26" rx="4" fill="white" fillOpacity="0.3"/>
              <circle cx="276" cy="224" r="8" fill="white" fillOpacity="0.4"/>
              <path d="M272 224l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Receipt kiri bawah */}
              <rect x="18" y="168" width="44" height="64" rx="4" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.25" strokeWidth="1"/>
              <rect x="24" y="176" width="32" height="3" rx="1.5" fill="white" fillOpacity="0.5"/>
              <rect x="24" y="183" width="24" height="2" rx="1" fill="white" fillOpacity="0.3"/>
              <rect x="24" y="189" width="28" height="2" rx="1" fill="white" fillOpacity="0.3"/>
              <rect x="24" y="195" width="20" height="2" rx="1" fill="white" fillOpacity="0.3"/>
              <rect x="24" y="204" width="32" height="4" rx="2" fill="white" fillOpacity="0.5"/>
              {/* Deco circles */}
              <circle cx="290" cy="30" r="20" fill="white" fillOpacity="0.05"/>
              <circle cx="30" cy="240" r="30" fill="white" fillOpacity="0.05"/>
            </svg>
          </div>

          <div className="login-left-text">
            <h2>Kelola Kasir dengan Mudah</h2>
            <p>Sistem point of sale modern untuk kafe dan restoran Anda.</p>
          </div>

          {/* Feature pills */}
          <div className="login-features">
            <div className="login-feature-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Manajemen Pesanan
            </div>
            <div className="login-feature-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Laporan Real-time
            </div>
            <div className="login-feature-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Multi Kasir
            </div>
          </div>
        </div>
      </div>

      {/* Panel Kanan — Form */}
      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-form-header">
            <div className="login-form-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h1>Masuk ke Akun</h1>
              <p className="muted">Gunakan username atau email yang terdaftar.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="login">Username / Email</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  id="login"
                  autoFocus
                  autoComplete="username"
                  className={errors.login ? 'invalid' : ''}
                  value={form.login}
                  onChange={update('login')}
                  placeholder="contoh: admin"
                  style={{paddingLeft: '38px'}}
                />
              </div>
              {errors.login && <div className="field-error">{errors.login}</div>}
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={errors.password ? 'invalid' : ''}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                  style={{paddingLeft: '38px'}}
                />
              </div>
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>
            <button className="btn btn-login btn-block btn-lg" disabled={submitting}>
              {submitting ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="spin-anim">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="login-footer-note">
            © 2025 Titik Temu Kopi. Sistem Kasir Modern.
          </p>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import api, { errorMessage } from '../lib/api'
import { dateTime, ORDER_TYPES, rupiah } from '../lib/format'
import { FALLBACK_PRODUCT_IMAGE, getProductImage } from '../lib/productImages'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const CATEGORY_COLORS = ['#2A9D92', '#5EC2B7', '#0F766E', '#F59E0B', '#3B82F6', '#94A3B8']

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    api
      .get('/dashboard')
      .then(({ data }) => setData(data))
      .catch((error) => toast.error(errorMessage(error)))
  }, [])

  if (!data) return <div className="page-loading">Memuat dashboard...</div>

  const trendChart = {
    labels: data.tren_7_hari.map((day) =>
      new Date(day.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
    ),
    datasets: [
      {
        label: 'Omset',
        data: data.tren_7_hari.map((day) => day.omset),
        backgroundColor: '#2A9D92',
        hoverBackgroundColor: '#1F7D74',
        borderRadius: 8,
      },
    ],
  }

  const categoryChart = {
    labels: data.distribusi_kategori.map((row) => row.kategori),
    datasets: [
      {
        data: data.distribusi_kategori.map((row) => row.qty),
        backgroundColor: CATEGORY_COLORS,
        borderWidth: 0,
      },
    ],
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Ringkasan {isAdmin ? 'operasional kafe' : 'transaksi Anda'} · {user.nama_lengkap}.
          </p>
        </div>
        <Link to="/pos" className="btn btn-primary btn-lg">
          <Icon name="plus" /> Transaksi Baru
        </Link>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-head-left">
              <div className="kpi-icon kpi-teal">
                <Icon name="money" />
              </div>
              <div>
                <div className="kpi-label">Total Omset Hari Ini</div>
                <div className="kpi-value">{rupiah(data.omset_hari_ini)}</div>
              </div>
            </div>
            <Link to={isAdmin ? '/reports' : '/orders'} className="btn btn-icon" title="Lihat rincian">
              <Icon name="more" size={16} />
            </Link>
          </div>
          <div className="kpi-sub">
            <span className="kpi-trend-up">↗ Pendapatan hari ini</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-head-left">
              <div className="kpi-icon kpi-green">
                <Icon name="receipt" />
              </div>
              <div>
                <div className="kpi-label">Jumlah Pesanan</div>
                <div className="kpi-value">{data.jumlah_pesanan}</div>
              </div>
            </div>
            <Link to="/orders" className="btn btn-icon" title="Lihat pesanan">
              <Icon name="more" size={16} />
            </Link>
          </div>
          <div className="kpi-sub">
            <span className="kpi-trend-up">↗ transaksi lunas hari ini</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-head-left">
              <div className="kpi-icon kpi-gold">
                <Icon name="star" />
              </div>
              <div>
                <div className="kpi-label">Menu Terlaris</div>
                <div className="kpi-value kpi-value-sm">{data.menu_terlaris?.nama_produk || '-'}</div>
              </div>
            </div>
            <Link to="/pos" className="btn btn-icon" title="Buka kasir">
              <Icon name="more" size={16} />
            </Link>
          </div>
          <div className="kpi-sub">
            {data.menu_terlaris ? `${data.menu_terlaris.total_qty} terjual hari ini` : 'belum ada penjualan'}
          </div>
        </div>

        <div className={`kpi-card ${data.stok_rendah.jumlah > 0 ? 'kpi-warning' : ''}`}>
          <div className="kpi-top">
            <div className="kpi-head-left">
              <div className="kpi-icon kpi-red">
                <Icon name="alert" />
              </div>
              <div>
                <div className="kpi-label">Stok Rendah</div>
                <div className="kpi-value">{data.stok_rendah.jumlah}</div>
              </div>
            </div>
            {isAdmin && (
              <Link to="/products" className="btn btn-icon" title="Kelola stok">
                <Icon name="more" size={16} />
              </Link>
            )}
          </div>
          <div className="kpi-sub">
            <span className={data.stok_rendah.jumlah > 0 ? 'kpi-trend-warn' : ''}>
              {data.stok_rendah.jumlah > 0 ? 'item di bawah batas minimum' : 'semua stok dalam batas aman'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-header">
            <h3>Tren Omset 7 Hari Terakhir</h3>
          </div>
          <div className="chart-box">
            <Bar
              data={trendChart}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx) => rupiah(ctx.raw) } },
                },
                scales: {
                  x: { grid: { display: false } },
                  y: {
                    grid: { color: '#eef3f4' },
                    ticks: { callback: (value) => `${value / 1000}rb` },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3>Distribusi Kategori (7 Hari)</h3>
          </div>
          <div className="chart-box">
            {data.distribusi_kategori.length ? (
              <Doughnut
                data={categoryChart}
                options={{ maintainAspectRatio: false, cutout: '64%', plugins: { legend: { position: 'bottom' } } }}
              />
            ) : (
              <div className="empty">Belum ada data</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-header">
            <h3>Transaksi Terbaru</h3>
            <Link to="/orders" className="link">
              Lihat semua
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>No. Faktur</th>
                  <th>Waktu</th>
                  <th>Tipe</th>
                  <th className="right">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transaksi_terbaru.map((order) => (
                  <tr key={order.id}>
                    <td className="mono">{order.invoice_number}</td>
                    <td>{dateTime(order.created_at)}</td>
                    <td>
                      {ORDER_TYPES[order.tipe_pesanan]}
                      {order.nomor_meja && ` · Meja ${order.nomor_meja}`}
                    </td>
                    <td className="right strong">{rupiah(order.grand_total)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
                {!data.transaksi_terbaru.length && (
                  <tr>
                    <td colSpan="5" className="empty">
                      Belum ada transaksi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3>Stok Rendah</h3>
            {isAdmin && (
              <Link to="/products" className="link">
                Kelola stok
              </Link>
            )}
          </div>
          <ul className="stock-list">
            {data.stok_rendah.items.map((product) => (
              <li key={product.id}>
                <div className="stock-item-info">
                  <img
                    className="stock-thumb"
                    src={getProductImage(product)}
                    alt={product.nama_produk}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_PRODUCT_IMAGE
                    }}
                  />
                  <span>{product.nama_produk}</span>
                </div>
                <span className={`stock-pill ${product.stok === 0 ? 'out' : ''}`}>
                  {product.stok} / min {product.stok_minimum} {product.unit}
                </span>
              </li>
            ))}
            {!data.stok_rendah.items.length && <li className="empty">Semua stok aman 👍</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}

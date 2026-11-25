import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token kedaluwarsa / tidak valid: bersihkan sesi lalu kembali ke login
    const isLoginRequest = error.config?.url?.includes('/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error) {
  const data = error.response?.data
  if (data?.errors) return Object.values(data.errors).flat()[0]
  return data?.message || 'Terjadi kesalahan, silakan coba lagi.'
}

export async function downloadFile(url, params, fallbackName) {
  const response = await api.get(url, { params, responseType: 'blob' })
  const disposition = response.headers['content-disposition'] || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(response.data)
  link.download = match ? match[1] : fallbackName
  link.click()
  URL.revokeObjectURL(link.href)
}

export default api

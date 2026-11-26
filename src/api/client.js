import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { getActiveRegister } from '@/lib/localPrinting'

const rawBaseURL = import.meta.env.VITE_API_URL || 'https://api.glaceroyalpos.net/api'
const baseURL = rawBaseURL.replace(/\/+$/, '')

const apiClient = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
  // withCredentials supprimé pour éviter les erreurs CSRF/Cross-domain sur Netlify
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Register-Number'] = getActiveRegister()
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient

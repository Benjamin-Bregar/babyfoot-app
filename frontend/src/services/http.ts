import axios from 'axios'
import { router } from '@/routes'
import { clearSessionToken } from '@/auth/session'
import { getSessionToken } from '@/auth/session'

const baseURL = import.meta.env.VITE_API_BASE_URL

if (!baseURL) {
  // Keep this warning to avoid silent misconfiguration in local environments.
  console.warn('VITE_API_BASE_URL is not set. API requests may fail.')
}

export const http = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = getSessionToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      clearSessionToken()
      await router.push('/login')
    }

    return Promise.reject(error)
  },
)

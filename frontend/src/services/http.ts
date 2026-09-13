import axios from 'axios'
import { useUserStore } from '../stores/userStore'
import { getApiBaseUrl } from '../utils/httpsRedirect'

const http = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function isGuestActionRequest(method?: string, url?: string) {
  const normalizedMethod = method?.toUpperCase()
  if (!normalizedMethod || !url) {
    return false
  }

  const requestPath = url.split('?')[0]

  if (normalizedMethod === 'POST' && requestPath === '/practice-sessions') {
    return true
  }

  if (normalizedMethod === 'POST' && /^\/practice-sessions\/\d+\/(submit|progress)$/.test(requestPath)) {
    return true
  }

  if ((normalizedMethod === 'POST' || normalizedMethod === 'DELETE') && /^\/review\/bookmarks\/\d+$/.test(requestPath)) {
    return true
  }

  if (normalizedMethod === 'POST' && /^\/speaking\/scenarios\/\d+\/attempts$/.test(requestPath)) {
    return true
  }

  return normalizedMethod === 'POST' && /^\/review\/wrong-questions\/\d+\/attempt$/.test(requestPath)
}

http.interceptors.response.use(
  (response) => {
    if (isGuestActionRequest(response.config.method, response.config.url)) {
      useUserStore.getState().recordGuestAction()
    }
    return response
  },
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.code === 'GUEST_LIMIT_REACHED') {
      window.dispatchEvent(new CustomEvent('allotcf:guest-limit-reached', {
        detail: {
          message: error.response.data.message,
        },
      }))
      return Promise.reject(error)
    }

    const isNotePermissionDenied = error.response?.status === 403 &&
      /^\/manage\/grammar-notes(?:[/?]|$)/.test(error.config?.url || '')
    if (error.response?.status === 401 || (error.response?.status === 403 && !isNotePermissionDenied)) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default http

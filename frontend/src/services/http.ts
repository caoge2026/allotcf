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

  if (normalizedMethod === 'POST' && url === '/practice-sessions') {
    return true
  }

  if (normalizedMethod === 'POST' && /^\/practice-sessions\/\d+\/(submit|progress)$/.test(url)) {
    return true
  }

  if ((normalizedMethod === 'POST' || normalizedMethod === 'DELETE') && /^\/review\/bookmarks\/\d+$/.test(url)) {
    return true
  }

  if (normalizedMethod === 'POST' && /^\/speaking\/scenarios\/\d+\/attempts$/.test(url)) {
    return true
  }

  return normalizedMethod === 'POST' && /^\/review\/wrong-questions\/\d+\/attempt$/.test(url)
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

    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default http

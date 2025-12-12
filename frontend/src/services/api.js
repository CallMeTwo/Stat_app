import axios from 'axios'

// Get the backend URL from environment or construct it from current hostname
const getBackendURL = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Otherwise, construct from current hostname
  const protocol = window.location.protocol
  const hostname = window.location.hostname

  // In production (deployed), use the same origin without port
  // In development (localhost), use port 5000
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
    return `${protocol}//${hostname}:5000`
  } else {
    // Production: same origin (backend serves frontend)
    return `${protocol}//${hostname}`
  }
}

const API_URL = getBackendURL()

console.log('API URL:', API_URL)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Don't set Content-Type for FormData (let axios set it automatically)
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    if (error.response) {
      console.error('Error Status:', error.response.status)
      console.error('Error Data:', error.response.data)
    }
    return Promise.reject(error)
  }
)

export default api

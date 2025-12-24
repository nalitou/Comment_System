import { API_BASE_URL } from '../config/env'
import { getStoredToken } from '../store/authStore'

export async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken()

  const headers = new Headers(options?.headers ?? {})
  const body = (options?.body ?? null) as any

  if (!(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return (await res.json()) as T

  const text = await res.text().catch(() => '')
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}

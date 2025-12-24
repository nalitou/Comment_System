import { Navigate } from 'react-router-dom'
import { authStore } from '../store/authStore'

export function RequireAdmin(props: { children: React.ReactNode }) {
  const token = authStore((s) => s.token)
  const role = authStore((s) => s.role)
  if (!token) return <Navigate to="/admin/login" replace />
  if (role !== 'admin') return <Navigate to="/" replace />
  return <>{props.children}</>
}

import { Navigate, useLocation } from 'react-router-dom'
import { authStore } from '../store/authStore'

export function RequireAuth(props: { children: React.ReactNode }) {
  const token = authStore((s) => s.token)
  const loc = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <>{props.children}</>
}

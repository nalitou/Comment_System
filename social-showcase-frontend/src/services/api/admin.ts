import { ENDPOINTS } from '../endpoints'
import { http } from '../http'
import { isMock } from '../runtime'
import { mockAdmin } from '../../mock/api'

function qs(obj: Record<string, unknown>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    sp.set(k, String(v))
  }
  return sp.toString()
}

export const adminApi = {
  login: (payload: { username: string; password: string }) =>
    isMock() ? mockAdmin.adminLogin(payload) : http(ENDPOINTS.admin.login, { method: 'POST', body: JSON.stringify(payload) }),

  listUsers: (payload: { q?: string; page: number; pageSize: number }) =>
    isMock() ? mockAdmin.adminListUsers(payload) : http(`${ENDPOINTS.admin.users}?${qs(payload as any)}`),

  deleteUser: (id: string) => (isMock() ? mockAdmin.adminDeleteUser(id) : http(ENDPOINTS.admin.removeUser(id), { method: 'DELETE' })),

  listPosts: (payload: { q?: string; tag?: string; page: number; pageSize: number }) =>
    isMock() ? mockAdmin.adminListPosts(payload) : http(`${ENDPOINTS.admin.posts}?${qs(payload as any)}`),

  deletePost: (id: string) => (isMock() ? mockAdmin.adminDeletePost(id) : http(ENDPOINTS.admin.removePost(id), { method: 'DELETE' })),

  stats: () => (isMock() ? mockAdmin.adminStats() : http(ENDPOINTS.admin.stats.active)),
}

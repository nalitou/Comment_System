import { ENDPOINTS } from '../endpoints'
import { http } from '../http'
import { isMock } from '../runtime'
import { mockAuth } from '../../mock/api'
import type { Role, User } from '../../types/models'

export interface AuthResult {
  token: string
  user: User
  role: Role
}

export const authApi = {
  sendSms: (payload: { phone: string; scene: string }) =>
    isMock()
      ? mockAuth.sendSms(payload.phone, payload.scene)
      : http<{ success: boolean }>(ENDPOINTS.auth.smsSend, { method: 'POST', body: JSON.stringify(payload) }),

  register: (payload: { phone: string; code: string; password?: string; nickname?: string }) =>
    isMock() ? (mockAuth.register(payload) as Promise<AuthResult>) : http<AuthResult>(ENDPOINTS.auth.register, { method: 'POST', body: JSON.stringify(payload) }),

  loginSms: (payload: { phone: string; code: string }) =>
    isMock() ? (mockAuth.loginBySms(payload) as Promise<AuthResult>) : http<AuthResult>(ENDPOINTS.auth.loginSms, { method: 'POST', body: JSON.stringify(payload) }),

  loginPassword: (payload: { phone: string; password: string }) =>
    isMock() ? (mockAuth.loginByPassword(payload) as Promise<AuthResult>) : http<AuthResult>(ENDPOINTS.auth.loginPassword, { method: 'POST', body: JSON.stringify(payload) }),

  resetPassword: (payload: { phone: string; code: string; newPassword: string }) =>
    isMock() ? mockAuth.resetPassword(payload) : http<{ success: boolean }>(ENDPOINTS.auth.passwordReset, { method: 'POST', body: JSON.stringify(payload) }),

  me: () => (isMock() ? (mockAuth.getMe() as Promise<{ user: User; role: Role }>) : http<{ user: User; role: Role }>(ENDPOINTS.auth.me)),

  updateMe: (payload: { nickname?: string; avatarUrl?: string; bio?: string; password?: string }) =>
    isMock() ? (mockAuth.updateMe(payload) as Promise<{ user: User }>) : http<{ user: User }>(ENDPOINTS.auth.me, { method: 'PUT', body: JSON.stringify(payload) }),
}


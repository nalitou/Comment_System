import { create } from 'zustand'
import type { Role, User } from '../types/models'

export interface AuthState {
  token: string | null
  user: User | null
  role: Role | null
  setAuth: (payload: { token: string; user: User; role: Role }) => void
  clear: () => void
}

const LS_TOKEN = 'social_showcase_token'

export const authStore = create<AuthState>((set) => ({
  token: localStorage.getItem(LS_TOKEN),
  user: null,
  role: null,
  setAuth: ({ token, user, role }) => {
    localStorage.setItem(LS_TOKEN, token)
    set({ token, user, role })
  },
  clear: () => {
    localStorage.removeItem(LS_TOKEN)
    set({ token: null, user: null, role: null })
  },
}))

export function getStoredToken() {
  return localStorage.getItem(LS_TOKEN)
}

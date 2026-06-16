import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'superadmin'
  permissions: string[]
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('ngrx_token') : null,
  user: typeof window !== 'undefined' ? (() => { try { const u = localStorage.getItem('ngrx_user'); return u ? JSON.parse(u) : null } catch { return null } })() : null,
  setAuth: (token, user) => {
    localStorage.setItem('ngrx_token', token)
    localStorage.setItem('ngrx_user', JSON.stringify(user))
    set({ token, user })
  },
  clearAuth: () => {
    localStorage.removeItem('ngrx_token')
    localStorage.removeItem('ngrx_user')
    set({ token: null, user: null })
  },
}))

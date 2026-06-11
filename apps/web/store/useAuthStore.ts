import { create } from 'zustand'

interface AuthState {
  token: string | null
  user: { email: string; role: string } | null
  setAuth: (token: string, user: { email: string; role: string }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('ngrx_token') : null,
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('ngrx_token', token)
    set({ token, user })
  },
  clearAuth: () => {
    localStorage.removeItem('ngrx_token')
    set({ token: null, user: null })
  },
}))

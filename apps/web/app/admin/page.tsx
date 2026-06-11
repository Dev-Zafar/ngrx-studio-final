'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export default function AdminLoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      setAuth(data.accessToken, data.user)
      router.replace('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <svg width="120" height="40" viewBox="0 0 120 40" fill="none" className="mx-auto mb-3">
            <text x="0" y="34" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="36" fill="#F8F8FF" letterSpacing="-1">NGR</text>
            <text x="83" y="34" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="36" fill="url(#loginXGrad)" letterSpacing="-1">X</text>
            <defs>
              <linearGradient id="loginXGrad" x1="83" y1="0" x2="120" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
              </linearGradient>
            </defs>
          </svg>
          <p className="font-mono text-xs text-text-3 tracking-[0.3em] uppercase">Admin Access</p>
        </div>

        <div className="p-8 rounded-2xl border border-border bg-surface/60">
          <h1 className="font-sora font-bold text-2xl text-text-1 mb-2">Welcome back</h1>
          <p className="text-text-3 text-sm mb-8">Sign in to manage your studio content.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-widest uppercase mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ngrxstudio.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 placeholder-text-3 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-widest uppercase mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 placeholder-text-3 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-1 to-accent-3 text-white font-space font-semibold hover:shadow-lg hover:shadow-accent-1/30 transition-all duration-300 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

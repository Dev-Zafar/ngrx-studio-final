'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { ThemeToggle } from '@/components/animations/ThemeToggle'

export default function AdminLoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      setAuth(data.accessToken, data.user)
      router.replace('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally { setLoading(false) }
  }

  const inp = 'w-full px-4 py-3.5 rounded-xl border font-space text-sm outline-none transition-all duration-200'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'var(--color-void)' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[140px]"
          style={{ background: 'rgba(124,58,237,0.08)' }} />
      </div>

      {/* Theme toggle top right */}
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <svg width="130" height="42" viewBox="0 0 130 42" fill="none" className="mx-auto mb-3">
            <text x="0" y="36" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="38" fill="var(--color-text-1)" letterSpacing="-1.5">NGR</text>
            <text x="93" y="36" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="38" fill="url(#loginXGrad)" letterSpacing="-1.5">X</text>
            <defs>
              <linearGradient id="loginXGrad" x1="93" y1="0" x2="130" y2="42" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
              </linearGradient>
            </defs>
          </svg>
          <p className="font-mono text-xs tracking-[0.35em] uppercase" style={{ color: 'var(--color-text-3)' }}>Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: 'var(--color-text-1)' }}>Welcome back</h1>
          <p className="font-space text-sm mb-8" style={{ color: 'var(--color-text-3)' }}>Sign in to manage your studio content</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="zafarjahangeer512@gmail.com" required className={inp}
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text-1)' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent-1)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              />
            </div>

            <div>
              <label className="block font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className={inp}
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text-1)', paddingRight: '3rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent-1)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--color-text-3)' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl border text-sm font-space text-center"
                style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-space font-semibold transition-all duration-200 disabled:opacity-60 hover:opacity-90 hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>
        </div>

        {/* Default credentials hint */}
        <div className="mt-5 p-4 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <p className="font-mono text-xs text-center mb-2" style={{ color: 'var(--color-text-3)' }}>🔐 Default Superadmin Credentials</p>
          <div className="space-y-1 text-center">
            <p className="font-mono text-xs" style={{ color: 'var(--color-text-2)' }}>zafarjahangeer512@gmail.com</p>
            <p className="font-mono text-xs" style={{ color: 'var(--color-text-2)' }}>NGRXStudio@2024!</p>
          </div>
          <p className="font-mono text-xs text-center mt-2" style={{ color: 'var(--color-text-3)' }}>Run <code>npm run seed</code> in apps/api to create this account</p>
        </div>

        <p className="text-center font-mono text-xs mt-5" style={{ color: 'var(--color-text-3)' }}>
          NGRX Studio © {new Date().getFullYear()} — Muhammad Zafar Jahangir
        </p>
      </div>
    </div>
  )
}

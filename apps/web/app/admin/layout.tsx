'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { ThemeToggle } from '@/components/animations/ThemeToggle'
import { useTheme } from '@/components/animations/ThemeProvider'

const navGroups = [
  {
    label: 'Content',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/admin/projects', label: 'Projects', icon: '🎬' },
      { href: '/admin/services', label: 'Services', icon: '⚡' },
      { href: '/admin/testimonials', label: 'Testimonials', icon: '💬' },
    ]
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/inquiries', label: 'Inquiries', icon: '📥' },
      { href: '/admin/admins', label: 'Admin Users', icon: '👥' },
    ]
  },
  {
    label: 'Configuration',
    items: [
      { href: '/admin/settings', label: 'Site Settings', icon: '⚙️' },
    ]
  }
]

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="80" height="26" viewBox="0 0 80 26" fill="none">
      <text x="0" y="22" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="24" fill="var(--color-text-1)" letterSpacing="-1">NGR</text>
      <text x="55" y="22" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="24" fill="url(#alXG)" letterSpacing="-1">X</text>
      <defs>
        <linearGradient id="alXG" x1="55" y1="0" x2="80" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
        </linearGradient>
      </defs>
    </svg>
    <span className="font-mono text-[10px] tracking-[0.3em] uppercase border-l pl-2"
      style={{ color: 'var(--color-text-3)', borderColor: 'var(--color-border)' }}>CMS</span>
  </div>
)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { token, clearAuth, user } = useAuthStore()
  const [checked, setChecked] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if (!token && pathname !== '/admin') router.replace('/admin')
    else setChecked(true)
  }, [token, pathname, router])

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/logout`, { method: 'POST', credentials: 'include' })
    clearAuth()
    router.replace('/admin')
  }

  if (!checked) return null
  if (!token) return <>{children}</>

  const Sidebar = () => (
    <aside className="w-64 flex flex-col fixed top-0 left-0 bottom-0 z-40 border-r"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      {/* Logo + theme */}
      <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <Logo />
        <ThemeToggle />
      </div>

      {/* User badge */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-accent-1), var(--color-accent-3))' }}>
            {((user as { name?: string })?.name || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-space text-sm font-semibold truncate" style={{ color: 'var(--color-text-1)' }}>
              {(user as { name?: string })?.name || 'Admin'}
            </p>
            <p className="font-mono text-xs truncate" style={{ color: 'var(--color-text-3)' }}>
              {(user as { role?: string })?.role || 'admin'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="font-mono text-[10px] tracking-widest uppercase px-3 mb-2" style={{ color: 'var(--color-text-3)' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-space text-sm transition-all duration-200"
                    style={isActive
                      ? { background: 'rgba(124,58,237,0.12)', color: 'var(--color-accent-1)', border: '1px solid rgba(124,58,237,0.2)' }
                      : { color: 'var(--color-text-2)', border: '1px solid transparent' }}
                    onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-surface2)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-1)' } }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-2)' } }}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                    {item.href === '/admin/inquiries' && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-accent-1" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--color-border)' }}>
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-space text-sm transition-all duration-200"
          style={{ color: 'var(--color-text-3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-1)'; (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-surface2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-3)'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
          <span>🌐</span> View Live Site
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-space text-sm transition-all duration-200 text-left"
          style={{ color: 'var(--color-text-3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.05)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-void)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg" style={{ color: 'var(--color-text-1)' }}>
            ☰
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-64 h-full" onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:ml-64 pt-0 lg:pt-0 min-h-screen">
        <div className="lg:hidden h-16" /> {/* mobile spacer */}
        <div className="p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}

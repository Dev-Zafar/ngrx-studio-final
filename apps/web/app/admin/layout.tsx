'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/projects', label: 'Projects', icon: '🎬' },
  { href: '/admin/testimonials', label: 'Testimonials', icon: '💬' },
  { href: '/admin/inquiries', label: 'Inquiries', icon: '📥' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { token, clearAuth } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!token && pathname !== '/admin') {
      router.replace('/admin')
    } else {
      setChecked(true)
    }
  }, [token, pathname, router])

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
    clearAuth()
    router.replace('/admin')
  }

  if (!checked) return null
  if (!token) return <>{children}</>

  return (
    <div className="min-h-screen bg-void flex">
      {/* Sidebar */}
      <aside className="w-60 bg-surface border-r border-border flex flex-col fixed top-0 left-0 bottom-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <svg width="80" height="26" viewBox="0 0 80 26" fill="none">
              <text x="0" y="22" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="24" fill="#F8F8FF" letterSpacing="-1">NGR</text>
              <text x="55" y="22" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="24" fill="url(#adminXGrad)" letterSpacing="-1">X</text>
              <defs>
                <linearGradient id="adminXGrad" x1="55" y1="0" x2="80" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="font-mono text-[10px] text-text-3 tracking-widest uppercase mt-1">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-space text-sm transition-all duration-200 ${
                pathname === item.href
                  ? 'bg-accent-1/15 text-accent-1 border border-accent-1/20'
                  : 'text-text-2 hover:bg-surface/80 hover:text-text-1'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-3 hover:text-red-400 hover:bg-red-400/5 font-space text-sm transition-all duration-200"
          >
            <span>🚪</span>
            Logout
          </button>
          <Link
            href="/"
            className="mt-2 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-3 hover:text-text-1 font-space text-sm transition-all duration-200"
          >
            <span>🌐</span>
            View Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}

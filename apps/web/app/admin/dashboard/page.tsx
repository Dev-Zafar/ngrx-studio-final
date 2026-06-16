'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'

interface Stats { projects: number; published: number; contacts: number; newContacts: number; testimonials: number; views: number }

export default function DashboardPage() {
  const { token, user } = useAuthStore()
  const [stats, setStats] = useState<Stats>({ projects: 0, published: 0, contacts: 0, newContacts: 0, testimonials: 0, views: 0 })
  const [loading, setLoading] = useState(true)
  const [recentContacts, setRecentContacts] = useState<Array<{ _id: string; name: string; email: string; services: string[]; createdAt: string; status: string }>>([])

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  const h = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      fetch(`${api}/projects`, { headers: h }).then(r => r.json()),
      fetch(`${api}/contact`, { headers: h }).then(r => r.json()),
      fetch(`${api}/testimonials`, { headers: h }).then(r => r.json()),
    ]).then(([projects, contacts, testimonials]) => {
      const proj = Array.isArray(projects) ? projects : []
      const cont = Array.isArray(contacts) ? contacts : []
      const test = Array.isArray(testimonials) ? testimonials : []
      const totalViews = proj.reduce((sum: number, p: { views?: number }) => sum + (p.views || 0), 0)
      setStats({
        projects: proj.length,
        published: proj.filter((p: { published: boolean }) => p.published).length,
        contacts: cont.length,
        newContacts: cont.filter((c: { status: string }) => c.status === 'new').length,
        testimonials: test.length,
        views: totalViews,
      })
      setRecentContacts(cont.slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  const statCards = [
    { label: 'Total Projects', value: stats.projects, sub: `${stats.published} live`, icon: '🎬', href: '/admin/projects', color: '#7C3AED' },
    { label: 'New Inquiries', value: stats.newContacts, sub: `${stats.contacts} total`, icon: '📥', href: '/admin/inquiries', color: '#06B6D4', highlight: stats.newContacts > 0 },
    { label: 'Testimonials', value: stats.testimonials, sub: 'All time', icon: '💬', href: '/admin/testimonials', color: '#A855F7' },
    { label: 'Total Views', value: stats.views, sub: 'Across all projects', icon: '👁️', href: '/admin/projects', color: '#10B981' },
  ]

  const quickActions = [
    { label: '+ New Project', href: '/admin/projects', icon: '🎬' },
    { label: '+ Testimonial', href: '/admin/testimonials', icon: '💬' },
    { label: 'Site Settings', href: '/admin/settings', icon: '⚙️' },
    { label: 'View Inquiries', href: '/admin/inquiries', icon: '📥' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-sora font-bold text-3xl mb-1" style={{ color: 'var(--color-text-1)' }}>
          Welcome back, {(user as { name?: string })?.name?.split(' ')[0] || 'Zafar'} 👋
        </h1>
        <p className="font-space text-sm" style={{ color: 'var(--color-text-3)' }}>
          Here's what's happening with your studio today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}
            className="p-5 rounded-2xl border transition-all duration-200 group relative overflow-hidden"
            style={{ borderColor: card.highlight ? 'rgba(124,58,237,0.4)' : 'var(--color-border)', background: 'var(--color-surface)' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = card.color + '50'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = card.highlight ? 'rgba(124,58,237,0.4)' : 'var(--color-border)'}>
            <div className="text-2xl mb-3">{card.icon}</div>
            <div className="font-sora font-extrabold text-3xl mb-1" style={{ color: card.color }}>
              {loading ? '—' : card.value}
            </div>
            <div className="font-space font-semibold text-sm mb-0.5" style={{ color: 'var(--color-text-1)' }}>{card.label}</div>
            <div className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>{card.sub}</div>
            {card.highlight && (
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent-1 animate-pulse" />
            )}
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="p-6 rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <h2 className="font-space font-semibold mb-5" style={{ color: 'var(--color-text-1)' }}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(a => (
              <Link key={a.label} href={a.href}
                className="flex items-center gap-3 p-4 rounded-xl border transition-all duration-200"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2, var(--color-void))' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(124,58,237,0.4)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(124,58,237,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-surface2, var(--color-void))' }}>
                <span className="text-xl">{a.icon}</span>
                <span className="font-space text-sm font-medium" style={{ color: 'var(--color-text-2)' }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent inquiries */}
        <div className="p-6 rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-space font-semibold" style={{ color: 'var(--color-text-1)' }}>Recent Inquiries</h2>
            <Link href="/admin/inquiries" className="font-mono text-xs transition-colors"
              style={{ color: 'var(--color-accent-2)' }}>View all →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--color-border)' }} />)}
            </div>
          ) : recentContacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-space text-sm" style={{ color: 'var(--color-text-3)' }}>No inquiries yet.</p>
              <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-text-3)' }}>They'll appear here when clients submit the contact form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContacts.map(c => (
                <Link key={c._id} href="/admin/inquiries"
                  className="flex items-center justify-between p-3 rounded-xl border transition-all"
                  style={{ borderColor: 'var(--color-border)', background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-surface2, var(--color-void))'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}>
                  <div>
                    <p className="font-space text-sm font-medium" style={{ color: 'var(--color-text-1)' }}>{c.name}</p>
                    <p className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>{c.services?.[0] || 'General inquiry'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono border ${c.status === 'new' ? 'border-accent-1/30 bg-accent-1/10 text-accent-1' : 'border-border text-text-3'}`}>
                    {c.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

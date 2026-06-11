'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface Stats { projects: number; contacts: number; testimonials: number }

export default function DashboardPage() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState<Stats>({ projects: 0, contacts: 0, testimonials: 0 })

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${api}/projects`, { headers: h }).then((r) => r.json()),
      fetch(`${api}/contact`, { headers: h }).then((r) => r.json()),
      fetch(`${api}/testimonials`, { headers: h }).then((r) => r.json()),
    ]).then(([projects, contacts, testimonials]) => {
      setStats({
        projects: Array.isArray(projects) ? projects.length : 0,
        contacts: Array.isArray(contacts) ? contacts.length : 0,
        testimonials: Array.isArray(testimonials) ? testimonials.length : 0,
      })
    }).catch(() => {})
  }, [token])

  const cards = [
    { label: 'Total Projects', value: stats.projects, icon: '🎬', color: '#7C3AED' },
    { label: 'Inquiries', value: stats.contacts, icon: '📥', color: '#06B6D4' },
    { label: 'Testimonials', value: stats.testimonials, icon: '💬', color: '#A855F7' },
    { label: 'Services', value: 5, icon: '⚡', color: '#10B981' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-sora font-bold text-3xl text-text-1">Dashboard</h1>
        <p className="text-text-3 mt-1 font-space">Welcome back to NGRX Studio CMS</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map((card) => (
          <div key={card.label} className="p-6 rounded-2xl border border-border bg-surface/60">
            <div className="text-3xl mb-3">{card.icon}</div>
            <div className="font-sora font-extrabold text-3xl text-text-1 mb-1">{card.value}</div>
            <div className="font-mono text-xs text-text-3 tracking-wider uppercase">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="p-6 rounded-2xl border border-border bg-surface/40">
        <h2 className="font-space font-semibold text-text-1 mb-5">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '+ New Project', href: '/admin/projects' },
            { label: '+ New Testimonial', href: '/admin/testimonials' },
            { label: 'View Inquiries', href: '/admin/inquiries' },
            { label: 'View Live Site', href: '/' },
          ].map((a) => (
            <a
              key={a.label}
              href={a.href}
              className="px-5 py-2.5 rounded-xl border border-accent-1/30 bg-accent-1/5 text-accent-1 font-space text-sm hover:bg-accent-1/15 transition-all duration-200"
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

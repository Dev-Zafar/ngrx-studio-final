'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button, Badge, Card, Alert, EmptyState, PageHeader } from '@/components/ui/AdminUI'

interface Contact {
  _id: string; name: string; email: string; budget: string
  services: string[]; brief: string
  status: 'new' | 'read' | 'replied' | 'archived'; createdAt: string
}

const STATUS_COLORS: Record<string, 'purple' | 'cyan' | 'green' | 'default'> = {
  new: 'purple', read: 'cyan', replied: 'green', archived: 'default'
}

export default function InquiriesPage() {
  const { token } = useAuthStore()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selected, setSelected] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [msg, setMsg] = useState('')

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${api}/contact`, { headers })
      const data = await res.json()
      if (Array.isArray(data)) setContacts(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`${api}/contact/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) })
    setMsg('✅ Status updated')
    setTimeout(() => setMsg(''), 3000)
    load()
    if (selected?._id === id) setSelected(s => s ? { ...s, status: status as Contact['status'] } : null)
  }

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.status === filter)
  const newCount = contacts.filter(c => c.status === 'new').length

  return (
    <div>
      <PageHeader
        title="Inquiries"
        subtitle={`${newCount} new · ${contacts.length} total`}
      />

      <Alert message={msg} type="success" />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl border w-fit" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        {['all', 'new', 'read', 'replied', 'archived'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase capitalize transition-all duration-200"
            style={filter === s
              ? { background: 'var(--color-accent-1)', color: '#fff' }
              : { color: 'var(--color-text-3)', background: 'transparent' }}>
            {s} {s === 'new' && newCount > 0 ? `(${newCount})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon="📥" title="No inquiries found"
            description={filter === 'all' ? "When clients fill out your contact form, inquiries appear here." : `No ${filter} inquiries.`} />
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-3">
            {filtered.map(c => (
              <button key={c._id} onClick={() => updateStatus(c._id, c.status === 'new' ? 'read' : c.status).then(() => setSelected(c))}
                className="w-full text-left p-5 rounded-2xl border transition-all duration-200"
                style={{
                  borderColor: selected?._id === c._id ? 'var(--color-accent-1)' : c.status === 'new' ? 'rgba(124,58,237,0.3)' : 'var(--color-border)',
                  background: selected?._id === c._id ? 'rgba(124,58,237,0.06)' : 'var(--color-surface)',
                }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--color-accent-1), var(--color-accent-3))' }}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-space font-semibold text-sm" style={{ color: 'var(--color-text-1)' }}>{c.name}</p>
                      <p className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>{c.email}</p>
                    </div>
                  </div>
                  <Badge color={STATUS_COLORS[c.status] || 'default'}>{c.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--color-border)', color: 'var(--color-text-3)' }}>{c.budget}</span>
                  {c.services?.slice(0, 2).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--color-border)', color: 'var(--color-text-3)' }}>{s}</span>
                  ))}
                  {(c.services?.length || 0) > 2 && <span className="text-xs" style={{ color: 'var(--color-text-3)' }}>+{c.services.length - 2}</span>}
                </div>
                <p className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>
                  {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </button>
            ))}
          </div>

          {/* Detail */}
          {selected ? (
            <Card className="h-fit sticky top-8">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-sora font-bold text-xl" style={{ color: 'var(--color-text-1)' }}>{selected.name}</h2>
                  <a href={`mailto:${selected.email}`} className="font-mono text-sm"
                    style={{ color: 'var(--color-accent-2)' }}>{selected.email}</a>
                </div>
                <Badge color={STATUS_COLORS[selected.status] || 'default'}>{selected.status}</Badge>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="font-mono text-xs tracking-wider uppercase mb-1.5" style={{ color: 'var(--color-text-3)' }}>Budget</p>
                  <p className="font-space text-sm font-medium" style={{ color: 'var(--color-text-1)' }}>{selected.budget}</p>
                </div>
                <div>
                  <p className="font-mono text-xs tracking-wider uppercase mb-1.5" style={{ color: 'var(--color-text-3)' }}>Services Requested</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.services?.map(s => <Badge key={s} color="purple">{s}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-xs tracking-wider uppercase mb-1.5" style={{ color: 'var(--color-text-3)' }}>Project Brief</p>
                  <p className="font-space text-sm leading-relaxed p-4 rounded-xl border"
                    style={{ color: 'var(--color-text-2)', background: 'var(--color-void)', borderColor: 'var(--color-border)' }}>
                    {selected.brief}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs tracking-wider uppercase mb-1.5" style={{ color: 'var(--color-text-3)' }}>Received</p>
                  <p className="font-space text-sm" style={{ color: 'var(--color-text-2)' }}>
                    {new Date(selected.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Status actions */}
              <div>
                <p className="font-mono text-xs tracking-wider uppercase mb-3" style={{ color: 'var(--color-text-3)' }}>Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['new', 'read', 'replied', 'archived'] as const).map(s => (
                    <button key={s} onClick={() => updateStatus(selected._id, s)}
                      className="px-3 py-2 rounded-xl border text-xs font-space font-medium capitalize transition-all duration-200"
                      style={selected.status === s
                        ? { background: 'rgba(124,58,237,0.12)', color: 'var(--color-accent-1)', borderColor: 'rgba(124,58,237,0.3)' }
                        : { color: 'var(--color-text-2)', borderColor: 'var(--color-border)', background: 'transparent' }}>
                      {s}
                    </button>
                  ))}
                </div>
                {/* Quick reply via email */}
                <a href={`mailto:${selected.email}?subject=Re: Your Project Brief — NGRX Studio&body=Hi ${selected.name},%0D%0A%0D%0AThank you for reaching out to NGRX Studio!%0D%0A%0D%0A`}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-space text-sm transition-all"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-2)', background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-accent-2)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-accent-2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-2)' }}>
                  ✉️ Reply via Email
                </a>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64 rounded-2xl border border-dashed"
              style={{ borderColor: 'var(--color-border)' }}>
              <p className="font-space text-sm" style={{ color: 'var(--color-text-3)' }}>Select an inquiry to view details</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface Contact {
  _id: string
  name: string
  email: string
  budget: string
  services: string[]
  brief: string
  status: 'new' | 'read' | 'replied' | 'archived'
  createdAt: string
}

const statusColors: Record<string, string> = {
  new: 'bg-accent-1/10 text-accent-1 border-accent-1/20',
  read: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  replied: 'bg-green-500/10 text-green-400 border-green-500/20',
  archived: 'bg-border text-text-3 border-border',
}

export default function InquiriesPage() {
  const { token } = useAuthStore()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selected, setSelected] = useState<Contact | null>(null)

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const load = async () => {
    const res = await fetch(`${api}/contact`, { headers })
    const data = await res.json()
    if (Array.isArray(data)) setContacts(data)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`${api}/contact/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) })
    load()
    if (selected?._id === id) setSelected((s) => s ? { ...s, status: status as Contact['status'] } : null)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-sora font-bold text-3xl text-text-1">Inquiries</h1>
        <p className="text-text-3 mt-1 font-space">{contacts.filter((c) => c.status === 'new').length} new · {contacts.length} total</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {contacts.length === 0 && (
            <div className="p-8 rounded-2xl border border-border text-center text-text-3 font-space text-sm">No inquiries yet.</div>
          )}
          {contacts.map((c) => (
            <div
              key={c._id}
              onClick={() => setSelected(c)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${selected?._id === c._id ? 'border-accent-1/40 bg-accent-1/5' : 'border-border bg-surface/40 hover:border-border/80'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-space font-semibold text-text-1 text-sm">{c.name}</div>
                  <div className="font-mono text-xs text-text-3">{c.email}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full border text-xs font-mono capitalize ${statusColors[c.status]}`}>
                  {c.status}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded border border-border bg-surface text-xs text-text-3">{c.budget}</span>
                {c.services.slice(0, 2).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded border border-border bg-surface text-xs text-text-3">{s}</span>
                ))}
                {c.services.length > 2 && <span className="text-xs text-text-3">+{c.services.length - 2}</span>}
              </div>
              <p className="text-text-3 text-xs mt-2">{new Date(c.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="p-6 rounded-2xl border border-border bg-surface/40 h-fit sticky top-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-sora font-bold text-xl text-text-1">{selected.name}</h2>
                <a href={`mailto:${selected.email}`} className="text-accent-2 text-sm hover:underline">{selected.email}</a>
              </div>
              <span className={`px-3 py-1 rounded-full border text-xs font-mono capitalize ${statusColors[selected.status]}`}>
                {selected.status}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="font-mono text-xs text-text-3 tracking-wider uppercase mb-1">Budget</p>
                <p className="font-space text-text-1 text-sm">{selected.budget}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-text-3 tracking-wider uppercase mb-1">Services</p>
                <div className="flex flex-wrap gap-2">
                  {selected.services.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-lg border border-border bg-void text-xs text-text-2">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-xs text-text-3 tracking-wider uppercase mb-1">Brief</p>
                <p className="font-space text-text-2 text-sm leading-relaxed bg-void/50 p-4 rounded-xl border border-border">{selected.brief}</p>
              </div>
            </div>

            <div>
              <p className="font-mono text-xs text-text-3 tracking-wider uppercase mb-3">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {(['new', 'read', 'replied', 'archived'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected._id, s)}
                    className={`px-4 py-2 rounded-xl border text-xs font-space capitalize transition-all duration-200 ${selected.status === s ? statusColors[s] : 'border-border text-text-3 hover:border-border/80'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-border border-dashed flex items-center justify-center">
            <p className="text-text-3 font-space text-sm">Select an inquiry to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}

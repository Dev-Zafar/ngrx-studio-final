'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface Testimonial { _id: string; name: string; role: string; company: string; quote: string; rating: number; published: boolean }

const empty = { name: '', role: '', company: '', quote: '', rating: 5, published: false }

export default function TestimonialsPage() {
  const { token } = useAuthStore()
  const [items, setItems] = useState<Testimonial[]>([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const load = async () => {
    const res = await fetch(`${api}/testimonials`, { headers })
    const data = await res.json()
    if (Array.isArray(data)) setItems(data)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = editId
      ? await fetch(`${api}/testimonials/${editId}`, { method: 'PUT', headers, body: JSON.stringify(form) })
      : await fetch(`${api}/testimonials`, { method: 'POST', headers, body: JSON.stringify(form) })
    if (res.ok) { setShowForm(false); setEditId(null); setForm(empty); load() }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    await fetch(`${api}/testimonials/${id}`, { method: 'DELETE', headers })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sora font-bold text-3xl text-text-1">Testimonials</h1>
          <p className="text-text-3 mt-1 font-space">{items.length} total</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(empty) }} className="px-5 py-2.5 rounded-xl bg-accent-1 text-white font-space font-semibold text-sm">
          + New Testimonial
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 rounded-2xl border border-border bg-surface/60">
          <h2 className="font-sora font-semibold text-xl text-text-1 mb-6">{editId ? 'Edit' : 'New'} Testimonial</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[['name', 'Name'], ['role', 'Role'], ['company', 'Company']].map(([k, l]) => (
              <div key={k}>
                <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">{l}</label>
                <input value={(form as Record<string, unknown>)[k] as string} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 font-space text-sm focus:outline-none focus:border-accent-1/60" />
              </div>
            ))}
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Rating (1-5)</label>
              <input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: +e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 font-space text-sm focus:outline-none" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Quote</label>
            <textarea value={form.quote} onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))} rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 font-space text-sm focus:outline-none resize-none" />
          </div>
          <label className="flex items-center gap-2 mb-6 cursor-pointer">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} className="accent-accent-1 w-4 h-4" />
            <span className="font-space text-sm text-text-2">Published</span>
          </label>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-accent-1 text-white font-space font-semibold text-sm disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-6 py-2.5 rounded-xl border border-border text-text-2 font-space text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item._id} className="p-5 rounded-2xl border border-border bg-surface/40">
            <div className="flex gap-1 mb-3">{[...Array(item.rating)].map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}</div>
            <p className="text-text-2 text-sm italic mb-4">"{item.quote.slice(0, 100)}..."</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-space font-semibold text-text-1 text-sm">{item.name}</p>
                <p className="font-mono text-xs text-text-3">{item.role} @ {item.company}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded-full border text-xs font-mono ${item.published ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'border-border text-text-3'}`}>
                  {item.published ? 'Live' : 'Draft'}
                </span>
                <button onClick={() => { setForm({ name: item.name, role: item.role, company: item.company, quote: item.quote, rating: item.rating, published: item.published }); setEditId(item._id); setShowForm(true) }}
                  className="px-3 py-1 rounded-lg border border-border text-xs text-text-2 hover:text-text-1">Edit</button>
                <button onClick={() => handleDelete(item._id)} className="px-3 py-1 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10">Del</button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-2 p-8 text-center text-text-3 font-space text-sm border border-dashed border-border rounded-2xl">No testimonials yet.</div>}
      </div>
    </div>
  )
}

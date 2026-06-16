'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button, Input, Textarea, Toggle, Badge, Card, Alert, EmptyState, PageHeader, ConfirmDialog } from '@/components/ui/AdminUI'

interface Testimonial {
  _id: string; name: string; role: string; company: string
  quote: string; rating: number; featured: boolean; published: boolean
  createdAt: string
}

const empty = { name: '', role: '', company: '', quote: '', rating: 5, featured: false, published: true }

export default function TestimonialsPage() {
  const { token } = useAuthStore()
  const [items, setItems] = useState<Testimonial[]>([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const showMsg = (m: string, t: 'success' | 'error' = 'success') => {
    setMsg(m); setMsgType(t); setTimeout(() => setMsg(''), 4000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${api}/testimonials`, { headers })
      const data = await res.json()
      if (Array.isArray(data)) setItems(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(empty); setEditId(null); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const openEdit = (item: Testimonial) => {
    setForm({ name: item.name, role: item.role, company: item.company, quote: item.quote, rating: item.rating, featured: item.featured, published: item.published })
    setEditId(item._id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const cancel = () => { setShowForm(false); setEditId(null); setForm(empty) }

  const handleSave = async () => {
    if (!form.name || !form.role || !form.company || !form.quote) { showMsg('Please fill all required fields', 'error'); return }
    setSaving(true)
    try {
      const res = editId
        ? await fetch(`${api}/testimonials/${editId}`, { method: 'PUT', headers, body: JSON.stringify(form) })
        : await fetch(`${api}/testimonials`, { method: 'POST', headers, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { showMsg(data.error || 'Failed to save', 'error'); return }
      showMsg(editId ? '✅ Testimonial updated!' : '✅ Testimonial created!')
      cancel(); load()
    } catch { showMsg('Network error', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`${api}/testimonials/${deleteTarget}`, { method: 'DELETE', headers })
      showMsg('✅ Deleted successfully')
      load()
    } finally { setDeleting(false); setDeleteTarget(null) }
  }

  const toggleField = async (id: string, field: 'published' | 'featured', current: boolean) => {
    const item = items.find(i => i._id === id)
    if (!item) return
    await fetch(`${api}/testimonials/${id}`, { method: 'PUT', headers, body: JSON.stringify({ ...item, [field]: !current }) })
    load()
  }

  return (
    <div>
      <PageHeader
        title="Testimonials"
        subtitle={`${items.length} total · ${items.filter(i => i.published).length} published · ${items.filter(i => i.featured).length} featured`}
        action={<Button onClick={openCreate}>+ New Testimonial</Button>}
      />

      <Alert message={msg} type={msgType} />

      {/* Form */}
      {showForm && (
        <Card className="mb-8">
          <h2 className="font-sora font-semibold text-xl mb-6" style={{ color: 'var(--color-text-1)' }}>
            {editId ? '✏️ Edit Testimonial' : '+ New Testimonial'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input label="Client Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="James Whitfield" />
            <Input label="Role / Title *" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Founder" />
            <Input label="Company *" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="NovaCast Media" />
          </div>

          <div className="mb-4">
            <Textarea label="Testimonial Quote *" value={form.quote}
              onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
              rows={4} placeholder="What did this client say about working with you?" />
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block font-mono text-xs tracking-wider uppercase mb-3" style={{ color: 'var(--color-text-3)' }}>Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}
                  className="text-2xl transition-all duration-150 hover:scale-110"
                  style={{ color: n <= form.rating ? '#fbbf24' : 'var(--color-border)' }}>
                  ★
                </button>
              ))}
              <span className="ml-2 font-mono text-sm self-center" style={{ color: 'var(--color-text-3)' }}>{form.rating}/5</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mb-6">
            <Toggle checked={form.published} onChange={v => setForm(f => ({ ...f, published: v }))}
              label="Published" description="Visible on the website" />
            <Toggle checked={form.featured} onChange={v => setForm(f => ({ ...f, featured: v }))}
              label="Featured" description="Shown prominently in the carousel" />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} loading={saving}>{editId ? 'Update Testimonial' : 'Create Testimonial'}</Button>
            <Button variant="secondary" onClick={cancel}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon="💬" title="No testimonials yet"
            description="Add testimonials from your happy clients to build social proof."
            action={<Button onClick={openCreate}>+ Add First Testimonial</Button>} />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map(item => (
            <Card key={item._id}>
              {/* Stars */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-sm" style={{ color: i < item.rating ? '#fbbf24' : 'var(--color-border)' }}>★</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {item.featured && <Badge color="purple">Featured</Badge>}
                  <Badge color={item.published ? 'green' : 'default'}>{item.published ? 'Live' : 'Draft'}</Badge>
                </div>
              </div>

              {/* Quote */}
              <p className="text-sm italic leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--color-text-2)' }}>
                "{item.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--color-accent-1), var(--color-accent-3))' }}>
                  {item.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-space text-sm font-semibold" style={{ color: 'var(--color-text-1)' }}>{item.name}</p>
                  <p className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>{item.role} @ {item.company}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button onClick={() => toggleField(item._id, 'published', item.published)}
                  className="text-xs font-mono transition-colors px-2.5 py-1.5 rounded-lg border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-3)' }}>
                  {item.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => toggleField(item._id, 'featured', item.featured)}
                  className="text-xs font-mono transition-colors px-2.5 py-1.5 rounded-lg border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-3)' }}>
                  {item.featured ? 'Unfeature' : 'Feature'}
                </button>
                <div className="flex-1" />
                <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(item._id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Testimonial"
        description="This action cannot be undone. The testimonial will be permanently removed."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button, Input, Textarea, Toggle, Badge, Card, Alert, EmptyState, PageHeader, ConfirmDialog } from '@/components/ui/AdminUI'
import { 
  Scissors, Mic, MonitorPlay, Sparkles, Paintbrush, 
  Search, Clapperboard, RefreshCw, Rocket, Video, 
  Target, Lightbulb, BarChart, Globe, Briefcase, Camera
} from 'lucide-react'

interface Service {
  _id: string; title: string; slug: string; icon: string
  shortDescription: string; fullDescription: string
  deliverables: string[]; order: number; published: boolean
}

// 1. Map string keys from the DB to actual Lucide SVG Components
const IconMap: Record<string, React.ElementType> = {
  'scissors': Scissors,
  'mic': Mic,
  'monitor-play': MonitorPlay,
  'sparkles': Sparkles,
  'paintbrush': Paintbrush,
  'search': Search,
  'clapperboard': Clapperboard,
  'refresh': RefreshCw,
  'rocket': Rocket,
  'video': Video,
  'target': Target,
  'lightbulb': Lightbulb,
  'bar-chart': BarChart,
  'globe': Globe,
  'briefcase': Briefcase,
  'camera': Camera
}

// 2. Dynamic icon renderer
function DynamicIcon({ name, className = '' }: { name: string, className?: string }) {
  const IconComponent = IconMap[name] || Sparkles // Fallback icon
  return <IconComponent className={className} strokeWidth={1.5} />
}

// 3. Updated options to use string keys instead of emojis
const ICON_OPTIONS = [
  'video', 'scissors', 'mic', 'monitor-play', 'sparkles', 
  'paintbrush', 'rocket', 'target', 'lightbulb', 'bar-chart', 
  'globe', 'briefcase', 'camera'
]

const empty = { title: '', icon: 'video', shortDescription: '', fullDescription: '', deliverables: '', order: 0, published: true }

export default function ServicesPage() {
  const { token } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
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
      const res = await fetch(`${api}/services?all=true`, { headers })
      const data = await res.json()
      if (Array.isArray(data)) setServices(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm({ ...empty, order: services.length + 1 }); setEditId(null); setShowForm(true) }
  const openEdit = (s: Service) => {
    setForm({ title: s.title, icon: s.icon, shortDescription: s.shortDescription, fullDescription: s.fullDescription || '', deliverables: (s.deliverables || []).join(', '), order: s.order, published: s.published })
    setEditId(s._id); setShowForm(true)
  }
  const cancel = () => { setShowForm(false); setEditId(null) }

  function slugify(str: string) { return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }

  const handleSave = async () => {
    if (!form.title || !form.shortDescription) { showMsg('Title and description are required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        slug: slugify(form.title),
        deliverables: form.deliverables.split(',').map(s => s.trim()).filter(Boolean),
      }
      const res = editId
        ? await fetch(`${api}/services/${editId}`, { method: 'PUT', headers, body: JSON.stringify(payload) })
        : await fetch(`${api}/services`, { method: 'POST', headers, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { showMsg(data.error || 'Failed to save', 'error'); return }
      showMsg(editId ? '✅ Service updated!' : '✅ Service created!')
      cancel(); load()
    } catch { showMsg('Network error', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`${api}/services/${deleteTarget}`, { method: 'DELETE', headers })
      showMsg('✅ Deleted')
      load()
    } finally { setDeleting(false); setDeleteTarget(null) }
  }

  const togglePublish = async (s: Service) => {
    await fetch(`${api}/services/${s._id}`, { method: 'PUT', headers, body: JSON.stringify({ ...s, published: !s.published }) })
    load()
  }

  const moveOrder = async (s: Service, dir: 'up' | 'down') => {
    const newOrder = dir === 'up' ? s.order - 1 : s.order + 1
    await fetch(`${api}/services/${s._id}`, { method: 'PUT', headers, body: JSON.stringify({ ...s, order: newOrder }) })
    load()
  }

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle={`${services.length} services · ${services.filter(s => s.published).length} visible on site`}
        action={<Button onClick={openCreate}>+ New Service</Button>}
      />

      <Alert message={msg} type={msgType} />

      {/* Info banner */}
      <div className="mb-6 p-4 rounded-xl border" style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.05)' }}>
        <p className="font-space text-sm" style={{ color: 'var(--color-text-2)' }}>
          💡 Services are displayed on the website in order of their <strong>sort order</strong>. Use the ↑↓ buttons to reorder them.
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-8">
          <h2 className="font-sora font-semibold text-xl mb-6" style={{ color: 'var(--color-text-1)' }}>
            {editId ? '✏️ Edit Service' : '+ New Service'}
          </h2>

          {/* SVG Icon picker */}
          <div className="mb-5">
            <label className="block font-mono text-xs tracking-wider uppercase mb-3" style={{ color: 'var(--color-text-3)' }}>Service Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                  className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-150 hover:scale-110"
                  style={form.icon === icon
                    ? { borderColor: 'var(--color-accent-1)', background: 'rgba(124,58,237,0.15)', color: 'var(--color-accent-1)' }
                    : { borderColor: 'var(--color-border)', background: 'transparent', color: 'var(--color-text-2)' }}>
                  <DynamicIcon name={icon} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input label="Service Title *" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Video Editing" />
            <Input label="Sort Order" type="number" value={form.order}
              onChange={e => setForm(f => ({ ...f, order: +e.target.value }))}
              hint="Lower number = shown first" />
          </div>

          <div className="mb-4">
            <Input label="Short Description *" value={form.shortDescription}
              onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
              placeholder="Cinematic cuts for YouTube, Reels, and Shorts..." />
          </div>

          <div className="mb-4">
            <Textarea label="Full Description" value={form.fullDescription}
              onChange={e => setForm(f => ({ ...f, fullDescription: e.target.value }))}
              rows={3} placeholder="Detailed description of this service..." />
          </div>

          <div className="mb-5">
            <Input label="Deliverables (comma separated)" value={form.deliverables}
              onChange={e => setForm(f => ({ ...f, deliverables: e.target.value }))}
              placeholder="Reels, Shorts, YouTube videos, TikToks"
              hint="These show as bullet points on the service card" />
          </div>

          <div className="mb-6">
            <Toggle checked={form.published} onChange={v => setForm(f => ({ ...f, published: v }))}
              label="Published" description="Show this service on the website" />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} loading={saving}>{editId ? 'Update Service' : 'Create Service'}</Button>
            <Button variant="secondary" onClick={cancel}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Services list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface)' }} />)}
        </div>
      ) : services.length === 0 ? (
        <Card>
          <EmptyState icon="⚡" title="No services yet"
            description="Add the services you offer to display them on your website."
            action={<Button onClick={openCreate}>+ Add First Service</Button>} />
        </Card>
      ) : (
        <div className="space-y-3">
          {[...services].sort((a, b) => a.order - b.order).map((s, idx) => (
            <Card key={s._id} padding={false}>
              <div className="flex items-center gap-4 p-4">
                {/* Order controls */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveOrder(s, 'up')} disabled={idx === 0}
                    className="w-6 h-6 rounded text-xs flex items-center justify-center disabled:opacity-30 transition-colors"
                    style={{ color: 'var(--color-text-3)', background: 'var(--color-border)' }}>↑</button>
                  <button onClick={() => moveOrder(s, 'down')} disabled={idx === services.length - 1}
                    className="w-6 h-6 rounded text-xs flex items-center justify-center disabled:opacity-30 transition-colors"
                    style={{ color: 'var(--color-text-3)', background: 'var(--color-border)' }}>↓</button>
                </div>

                {/* SVG Icon Display */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-surface2, var(--color-void))', border: '1px solid var(--color-border)', color: 'var(--color-text-1)' }}>
                  <DynamicIcon name={s.icon} className="w-6 h-6" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-space font-semibold text-sm" style={{ color: 'var(--color-text-1)' }}>{s.title}</p>
                    <Badge color={s.published ? 'green' : 'default'}>{s.published ? 'Live' : 'Hidden'}</Badge>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-3)' }}>{s.shortDescription}</p>
                  {s.deliverables?.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {s.deliverables.slice(0, 3).map(d => (
                        <span key={d} className="px-2 py-0.5 rounded text-xs font-mono"
                          style={{ background: 'var(--color-border)', color: 'var(--color-text-3)' }}>{d}</span>
                      ))}
                      {s.deliverables.length > 3 && <span className="text-xs" style={{ color: 'var(--color-text-3)' }}>+{s.deliverables.length - 3}</span>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => togglePublish(s)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-3)' }}>
                    {s.published ? 'Hide' : 'Show'}
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(s._id)}>Del</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Service"
        description="This will remove the service from your website."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
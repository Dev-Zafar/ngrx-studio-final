'use client'
import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface Project { _id: string; title: string; category: string; client: string; published: boolean; featured: boolean; year: number; mediaType: string; views: number }

const emptyForm = {
  title: '', category: 'video', mediaType: 'image', client: '', clientLocation: '',
  year: new Date().getFullYear(), description: '', challenge: '',
  deliverables: '', tags: '', results: [{ label: '', value: '' }],
  videoUrl: '', embedUrl: '', reelUrl: '',
  published: false, featured: false, order: 0,
}

export default function ProjectsPage() {
  const { token } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState('')
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  const authHeader = { Authorization: `Bearer ${token}` }

  const load = async () => {
    const res = await fetch(`${api}/projects`, { headers: authHeader })
    const data = await res.json()
    if (Array.isArray(data)) setProjects(data)
  }

  useEffect(() => { load() }, [])

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbFile(file)
    setThumbPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.title || !form.client || !form.description) { setMsg('Title, client and description are required'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      // Append all text fields
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'results') fd.append(k, JSON.stringify(v))
        else if (k === 'deliverables' || k === 'tags') fd.append(k, v as string)
        else fd.append(k, String(v))
      })
      if (thumbFile) fd.append('thumbnail', thumbFile)

      const res = editId
        ? await fetch(`${api}/projects/${editId}`, { method: 'PUT', headers: authHeader, body: fd })
        : await fetch(`${api}/projects`, { method: 'POST', headers: authHeader, body: fd })

      if (res.ok) {
        setMsg(editId ? '✅ Project updated!' : '✅ Project created!')
        setShowForm(false); setEditId(null); setForm(emptyForm)
        setThumbFile(null); setThumbPreview('')
        load()
      } else {
        const d = await res.json()
        setMsg(`❌ ${d.error || 'Save failed'}`)
      }
    } catch (err) { setMsg(`❌ ${String(err)}`) }
    finally { setSaving(false); setTimeout(() => setMsg(''), 4000) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return
    await fetch(`${api}/projects/${id}`, { method: 'DELETE', headers: authHeader })
    load()
  }

  const handleTogglePublish = async (id: string) => {
    await fetch(`${api}/projects/${id}/toggle-publish`, { method: 'PATCH', headers: authHeader })
    load()
  }

  const startEdit = (p: Project & Record<string, unknown>) => {
    setForm({
      title: p.title as string, category: p.category as string, mediaType: (p.mediaType as string) || 'image',
      client: p.client as string, clientLocation: (p.clientLocation as string) || '',
      year: p.year as number, description: (p.description as string) || '', challenge: (p.challenge as string) || '',
      deliverables: Array.isArray(p.deliverables) ? (p.deliverables as string[]).join(', ') : '',
      tags: Array.isArray(p.tags) ? (p.tags as string[]).join(', ') : '',
      results: (p.results as Array<{label:string;value:string}> || [{ label: '', value: '' }]),
      videoUrl: (p.videoUrl as string) || '', embedUrl: (p.embedUrl as string) || '', reelUrl: (p.reelUrl as string) || '',
      published: p.published as boolean, featured: p.featured as boolean, order: (p.order as number) || 0,
    })
    if ((p as Record<string,unknown>).thumbnail && ((p as Record<string,unknown>).thumbnail as {url:string}).url) {
      setThumbPreview(((p as Record<string,unknown>).thumbnail as {url:string}).url)
    }
    setEditId(p._id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const input = 'w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 placeholder-text-3 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sora font-bold text-3xl text-text-1">Projects</h1>
          <p className="text-text-3 mt-1 font-space">{projects.length} total · {projects.filter(p => p.published).length} live</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setThumbFile(null); setThumbPreview('') }}
          className="px-5 py-2.5 rounded-xl bg-accent-1 text-white font-space font-semibold text-sm hover:bg-accent-1/80 transition-colors">
          + New Project
        </button>
      </div>

      {msg && <div className={`mb-4 p-3 rounded-lg border text-sm font-space ${msg.startsWith('✅') ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>{msg}</div>}

      {/* FORM */}
      {showForm && (
        <div className="mb-8 p-6 rounded-2xl border border-border bg-surface/60">
          <h2 className="font-sora font-semibold text-text-1 text-xl mb-6">{editId ? '✏️ Edit' : '+ New'} Project</h2>

          {/* Thumbnail upload */}
          <div className="mb-6">
            <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-3">Thumbnail / Cover Image</label>
            <div className="flex items-center gap-4">
              {thumbPreview && (
                <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-border">
                  <img src={thumbPreview} alt="thumb" className="w-full h-full object-cover" />
                </div>
              )}
              <button type="button" onClick={() => thumbInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl border border-border text-text-2 font-space text-sm hover:border-accent-1/40 hover:text-text-1 transition-colors">
                {thumbPreview ? '🔄 Change Image' : '📸 Upload Thumbnail'}
              </button>
              <input ref={thumbInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleThumbChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Project title" className={input} />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Client *</label>
              <input value={form.client} onChange={e => setForm(f => ({...f, client: e.target.value}))} placeholder="Client name" className={input} />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={input}>
                {['video','graphics','social','branding'].map(c => <option key={c} value={c} className="bg-surface">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Media Type</label>
              <select value={form.mediaType} onChange={e => setForm(f => ({...f, mediaType: e.target.value}))} className={input}>
                {['image','video','reel','youtube','vimeo'].map(m => <option key={m} value={m} className="bg-surface">{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Client Location</label>
              <input value={form.clientLocation} onChange={e => setForm(f => ({...f, clientLocation: e.target.value}))} placeholder="Dubai, UAE" className={input} />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Year</label>
              <input type="number" value={form.year} onChange={e => setForm(f => ({...f, year: +e.target.value}))} className={input} />
            </div>
          </div>

          {/* Video URL fields — shown based on mediaType */}
          {(form.mediaType === 'youtube' || form.mediaType === 'vimeo') && (
            <div className="mb-4">
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Embed URL</label>
              <input value={form.embedUrl} onChange={e => setForm(f => ({...f, embedUrl: e.target.value}))} placeholder="https://www.youtube.com/embed/VIDEO_ID" className={input} />
              <p className="text-text-3 text-xs mt-1">For YouTube: use https://www.youtube.com/embed/VIDEO_ID format</p>
            </div>
          )}
          {form.mediaType === 'reel' && (
            <div className="mb-4">
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Reel / Short URL</label>
              <input value={form.reelUrl} onChange={e => setForm(f => ({...f, reelUrl: e.target.value}))} placeholder="https://www.instagram.com/reel/..." className={input} />
            </div>
          )}
          {form.mediaType === 'video' && (
            <div className="mb-4">
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Direct Video URL (mp4)</label>
              <input value={form.videoUrl} onChange={e => setForm(f => ({...f, videoUrl: e.target.value}))} placeholder="https://..." className={input} />
            </div>
          )}

          <div className="mb-4">
            <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Description *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="Project description..." className={`${input} resize-none`} />
          </div>
          <div className="mb-4">
            <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Challenge</label>
            <textarea value={form.challenge} onChange={e => setForm(f => ({...f, challenge: e.target.value}))} rows={2} placeholder="What was the client's challenge?" className={`${input} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Deliverables (comma separated)</label>
              <input value={form.deliverables} onChange={e => setForm(f => ({...f, deliverables: e.target.value}))} placeholder="Video Editing, Motion Graphics" className={input} />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Tags (comma separated)</label>
              <input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="youtube, fitness, editing" className={input} />
            </div>
          </div>

          {/* Results */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-xs text-text-3 tracking-wider uppercase">Results / Metrics</label>
              <button type="button" onClick={() => setForm(f => ({...f, results: [...f.results, {label:'',value:''}]}))}
                className="text-xs text-accent-2 hover:text-accent-1 font-space transition-colors">+ Add Metric</button>
            </div>
            <div className="space-y-2">
              {form.results.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={r.label} onChange={e => { const results = [...form.results]; results[i] = {...results[i], label: e.target.value}; setForm(f => ({...f, results})) }}
                    placeholder="e.g. Total Views" className={`${input} flex-1`} />
                  <input value={r.value} onChange={e => { const results = [...form.results]; results[i] = {...results[i], value: e.target.value}; setForm(f => ({...f, results})) }}
                    placeholder="e.g. 2.1M" className={`${input} w-32`} />
                  {form.results.length > 1 && (
                    <button type="button" onClick={() => setForm(f => ({...f, results: f.results.filter((_,j) => j !== i)}))}
                      className="text-red-400 hover:text-red-300 text-lg px-2">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-6 mb-6">
            {[['published','Published (visible on site)'],['featured','Featured (shown at top)']].map(([k,l]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as Record<string,unknown>)[k] as boolean}
                  onChange={e => setForm(f => ({...f, [k]: e.target.checked}))} className="accent-accent-1 w-4 h-4" />
                <span className="font-space text-sm text-text-2">{l}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-accent-1 text-white font-space font-semibold text-sm disabled:opacity-60 hover:bg-accent-1/80 transition-colors">
              {saving ? 'Saving...' : editId ? 'Update Project' : 'Create Project'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="px-6 py-2.5 rounded-xl border border-border text-text-2 font-space text-sm hover:text-text-1 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-2xl border border-border bg-surface/40 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Project','Category','Media','Client','Year','Views','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-4 text-left font-mono text-xs text-text-3 tracking-wider uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-text-3 font-space text-sm">
                No projects yet. Run <code className="bg-surface px-2 py-0.5 rounded text-accent-2">npm run seed</code> in the API folder to add 8 demo projects.
              </td></tr>
            )}
            {projects.map((p) => (
              <tr key={p._id} className="border-b border-border/40 hover:bg-surface/60 transition-colors">
                <td className="px-4 py-3 font-space text-sm text-text-1 max-w-[160px] truncate">{p.title}</td>
                <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full border border-border bg-surface text-xs font-mono text-text-2 capitalize">{p.category}</span></td>
                <td className="px-4 py-3"><span className="font-mono text-xs text-accent-2 capitalize">{p.mediaType}</span></td>
                <td className="px-4 py-3 font-space text-sm text-text-2 max-w-[120px] truncate">{p.client}</td>
                <td className="px-4 py-3 font-mono text-sm text-text-3">{p.year}</td>
                <td className="px-4 py-3 font-mono text-sm text-text-3">{p.views || 0}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleTogglePublish(p._id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-mono cursor-pointer transition-all ${p.published ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' : 'bg-border text-text-3 border border-border hover:border-accent-1/30'}`}>
                    {p.published ? '✓ Live' : 'Draft'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => startEdit(p as Project & Record<string,unknown>)}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-2 hover:text-text-1 hover:border-accent-1/30 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(p._id)}
                      className="px-3 py-1.5 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-colors">Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

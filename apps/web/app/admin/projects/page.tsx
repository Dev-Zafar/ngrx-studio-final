'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface Project {
  _id: string
  title: string
  category: string
  client: string
  published: boolean
  featured: boolean
  year: number
}

const emptyForm = { title: '', category: 'video', client: '', clientLocation: '', year: new Date().getFullYear(), description: '', challenge: '', deliverables: '', published: false, featured: false }

export default function ProjectsPage() {
  const { token } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const load = async () => {
    const res = await fetch(`${api}/projects`, { headers })
    const data = await res.json()
    if (Array.isArray(data)) setProjects(data)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, deliverables: form.deliverables.split(',').map((s) => s.trim()).filter(Boolean) }
      const res = editId
        ? await fetch(`${api}/projects/${editId}`, { method: 'PUT', headers, body: JSON.stringify(payload) })
        : await fetch(`${api}/projects`, { method: 'POST', headers, body: JSON.stringify(payload) })
      if (res.ok) { setMsg('Saved!'); setShowForm(false); setEditId(null); setForm(emptyForm); load() }
      else { const d = await res.json(); setMsg(d.error || 'Error') }
    } finally { setSaving(false); setTimeout(() => setMsg(''), 3000) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return
    await fetch(`${api}/projects/${id}`, { method: 'DELETE', headers })
    load()
  }

  const startEdit = (p: Project & Record<string, unknown>) => {
    setForm({ title: p.title as string, category: p.category as string, client: p.client as string, clientLocation: (p.clientLocation as string) || '', year: p.year as number, description: (p.description as string) || '', challenge: (p.challenge as string) || '', deliverables: Array.isArray(p.deliverables) ? (p.deliverables as string[]).join(', ') : '', published: p.published as boolean, featured: p.featured as boolean })
    setEditId(p._id)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sora font-bold text-3xl text-text-1">Projects</h1>
          <p className="text-text-3 mt-1 font-space">{projects.length} total</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="px-5 py-2.5 rounded-xl bg-accent-1 text-white font-space font-semibold text-sm hover:bg-accent-1/80 transition-colors"
        >
          + New Project
        </button>
      </div>

      {msg && <div className="mb-4 p-3 rounded-lg border border-accent-1/30 bg-accent-1/10 text-accent-1 text-sm">{msg}</div>}

      {/* Form */}
      {showForm && (
        <div className="mb-8 p-6 rounded-2xl border border-border bg-surface/60">
          <h2 className="font-sora font-semibold text-text-1 text-xl mb-6">{editId ? 'Edit' : 'New'} Project</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'client', label: 'Client', type: 'text' },
              { key: 'clientLocation', label: 'Client Location', type: 'text' },
              { key: 'year', label: 'Year', type: 'number' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">{label}</label>
                <input
                  type={type}
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 font-space text-sm focus:outline-none"
              >
                {['video', 'graphics', 'social', 'branding'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Deliverables (comma separated)</label>
              <input
                value={form.deliverables}
                onChange={(e) => setForm((f) => ({ ...f, deliverables: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-4 mt-4">
            {[
              { key: 'published', label: 'Published' },
              { key: 'featured', label: 'Featured' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form as Record<string, unknown>)[key] as boolean}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  className="accent-accent-1 w-4 h-4"
                />
                <span className="font-space text-sm text-text-2">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-accent-1 text-white font-space font-semibold text-sm disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Project'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null) }}
              className="px-6 py-2.5 rounded-xl border border-border text-text-2 font-space text-sm hover:text-text-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface/40 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Title', 'Category', 'Client', 'Year', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-4 text-left font-mono text-xs text-text-3 tracking-wider uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-text-3 font-space text-sm">No projects yet. Create your first one!</td></tr>
            )}
            {projects.map((p) => (
              <tr key={p._id} className="border-b border-border/50 hover:bg-surface/60 transition-colors">
                <td className="px-5 py-4 font-space text-sm text-text-1">{p.title}</td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-full border border-border bg-surface text-xs font-mono text-text-2 capitalize">{p.category}</span>
                </td>
                <td className="px-5 py-4 font-space text-sm text-text-2">{p.client}</td>
                <td className="px-5 py-4 font-mono text-sm text-text-3">{p.year}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono ${p.published ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-border text-text-3 border border-border'}`}>
                    {p.published ? 'Live' : 'Draft'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p as Project & Record<string, unknown>)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-2 hover:text-text-1 hover:border-accent-1/30 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(p._id)} className="px-3 py-1.5 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-colors">Delete</button>
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

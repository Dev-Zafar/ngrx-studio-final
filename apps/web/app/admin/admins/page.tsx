'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface Admin { _id: string; name: string; email: string; role: string; permissions: string[]; isActive: boolean; lastLogin: string; createdAt: string }

const allPermissions = ['projects', 'testimonials', 'contacts', 'services', 'admins', 'settings']
const empty = { name: '', email: '', password: '', permissions: ['projects', 'testimonials', 'contacts', 'services'] as string[] }

export default function AdminsPage() {
  const { token, user } = useAuthStore()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const load = async () => {
    const res = await fetch(`${api}/admins`, { headers })
    const data = await res.json()
    if (Array.isArray(data)) setAdmins(data)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.name || !form.email) { setMsg('Name and email are required'); return }
    if (!editId && !form.password) { setMsg('Password is required for new admins'); return }
    setSaving(true)
    try {
      const payload = editId ? { name: form.name, permissions: form.permissions, ...(form.password ? { password: form.password } : {}) }
        : { name: form.name, email: form.email, password: form.password, permissions: form.permissions }

      const res = editId
        ? await fetch(`${api}/admins/${editId}`, { method: 'PUT', headers, body: JSON.stringify(payload) })
        : await fetch(`${api}/admins`, { method: 'POST', headers, body: JSON.stringify(payload) })

      const data = await res.json()
      if (res.ok) { setMsg(editId ? '✅ Admin updated!' : '✅ Admin created!'); setShowForm(false); setEditId(null); setForm(empty); load() }
      else setMsg(`❌ ${data.error}`)
    } finally { setSaving(false); setTimeout(() => setMsg(''), 4000) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this admin account?')) return
    const res = await fetch(`${api}/admins/${id}`, { method: 'DELETE', headers })
    const data = await res.json()
    if (!res.ok) { setMsg(`❌ ${data.error}`); return }
    load()
  }

  const togglePermission = (perm: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm]
    }))
  }

  const input = 'w-full px-4 py-3 rounded-xl border border-border bg-void text-text-1 placeholder-text-3 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors'

  if (user && (user as { role?: string }).role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-text-2 font-space">Superadmin access required.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sora font-bold text-3xl text-text-1">Admin Users</h1>
          <p className="text-text-3 mt-1 font-space">{admins.length} admins · Superadmin panel</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(empty) }}
          className="px-5 py-2.5 rounded-xl bg-accent-1 text-white font-space font-semibold text-sm hover:bg-accent-1/80 transition-colors">
          + Add Admin
        </button>
      </div>

      {msg && <div className={`mb-4 p-3 rounded-lg border text-sm font-space ${msg.startsWith('✅') ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>{msg}</div>}

      {/* Form */}
      {showForm && (
        <div className="mb-8 p-6 rounded-2xl border border-border bg-surface/60">
          <h2 className="font-sora font-semibold text-xl text-text-1 mb-6">{editId ? 'Edit Admin' : 'Create New Admin'}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Admin Name" className={input} />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="admin@example.com" disabled={!!editId} className={`${input} disabled:opacity-50`} />
            </div>
            <div className="col-span-2">
              <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-2">
                Password {editId && <span className="text-text-3 normal-case">(leave blank to keep current)</span>}
              </label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" className={input} />
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-mono text-xs text-text-3 tracking-wider uppercase mb-3">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {allPermissions.map(perm => (
                <button key={perm} type="button" onClick={() => togglePermission(perm)}
                  className={`px-4 py-2 rounded-lg border text-sm font-space capitalize transition-all duration-200 ${form.permissions.includes(perm) ? 'border-accent-1 bg-accent-1/15 text-accent-1' : 'border-border bg-surface/40 text-text-2 hover:border-accent-1/40'}`}>
                  {perm}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-accent-1 text-white font-space font-semibold text-sm disabled:opacity-60">
              {saving ? 'Saving...' : editId ? 'Update Admin' : 'Create Admin'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="px-6 py-2.5 rounded-xl border border-border text-text-2 font-space text-sm hover:text-text-1">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Admin list */}
      <div className="space-y-4">
        {admins.map((admin) => (
          <div key={admin._id} className="p-5 rounded-2xl border border-border bg-surface/40 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-1 to-accent-3 flex items-center justify-center font-sora font-bold text-white text-sm flex-shrink-0">
                {admin.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-space font-semibold text-text-1">{admin.name}</span>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-mono ${admin.role === 'superadmin' ? 'bg-accent-1/10 text-accent-1 border-accent-1/20' : 'bg-border text-text-3 border-border'}`}>
                    {admin.role}
                  </span>
                  {!admin.isActive && <span className="px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-mono">Inactive</span>}
                </div>
                <p className="font-mono text-xs text-text-3 mb-2">{admin.email}</p>
                <div className="flex flex-wrap gap-1.5">
                  {admin.permissions?.map(p => (
                    <span key={p} className="px-2 py-0.5 rounded text-xs font-mono bg-surface border border-border text-text-3 capitalize">{p}</span>
                  ))}
                </div>
                {admin.lastLogin && <p className="text-text-3 text-xs mt-2 font-mono">Last login: {new Date(admin.lastLogin).toLocaleDateString()}</p>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {admin.role !== 'superadmin' && (
                <>
                  <button
                    onClick={() => { setForm({ name: admin.name, email: admin.email, password: '', permissions: admin.permissions }); setEditId(admin._id); setShowForm(true) }}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-2 hover:text-text-1 hover:border-accent-1/30 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(admin._id)}
                    className="px-3 py-1.5 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

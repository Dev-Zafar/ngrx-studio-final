'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface Settings {
  email: string; whatsapp: string
  instagram: string; youtube: string; linkedin: string
  behance: string; tiktok: string; twitter: string
  heroHeadline: string; heroSubtext: string; heroRotatingWords: string[]
  availabilityText: string; isAvailable: boolean
  aboutBio: string; yearsExperience: number; basedIn: string
  seoTitle: string; seoDescription: string
  brandName: string; tagline: string
}

const defaultSettings: Settings = {
  email: '', whatsapp: '', instagram: '', youtube: '', linkedin: '',
  behance: '', tiktok: '', twitter: '',
  heroHeadline: '', heroSubtext: '', heroRotatingWords: [],
  availabilityText: '', isAvailable: true,
  aboutBio: '', yearsExperience: 4, basedIn: '',
  seoTitle: '', seoDescription: '',
  brandName: '', tagline: '',
}

type TabId = 'contact' | 'socials' | 'hero' | 'about' | 'seo' | 'security'

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'contact', label: 'Contact Info', icon: '📞' },
  { id: 'socials', label: 'Social Links', icon: '🌐' },
  { id: 'hero', label: 'Hero Section', icon: '🎬' },
  { id: 'about', label: 'About Section', icon: '👤' },
  { id: 'seo', label: 'SEO & Branding', icon: '🔍' },
  { id: 'security', label: 'Admin Security', icon: '🔐' },
]

export default function SettingsPage() {
  const { token } = useAuthStore()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [activeTab, setActiveTab] = useState<TabId>('contact')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [rotatingWordInput, setRotatingWordInput] = useState('')

  // Admin password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetch(`${api}/settings`, { headers })
      .then(r => r.json())
      .then(data => { setSettings({ ...defaultSettings, ...data }); setRotatingWordInput((data.heroRotatingWords || []).join(', ')) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const payload = { ...settings, heroRotatingWords: rotatingWordInput.split(',').map(s => s.trim()).filter(Boolean) }
    try {
      const res = await fetch(`${api}/settings`, { method: 'PUT', headers, body: JSON.stringify(payload) })
      const data = await res.json()
      if (res.ok) { setSettings({ ...defaultSettings, ...data }); setMsg('✅ Settings saved successfully!') }
      else setMsg(`❌ ${data.error}`)
    } catch { setMsg('❌ Failed to save') }
    finally { setSaving(false); setTimeout(() => setMsg(''), 4000) }
  }

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg('❌ Passwords do not match'); return }
    if (pwForm.newPassword.length < 8) { setPwMsg('❌ Password must be at least 8 characters'); return }
    setPwSaving(true)
    try {
      const res = await fetch(`${api}/auth/change-password`, {
        method: 'POST', headers,
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      })
      const data = await res.json()
      if (res.ok) { setPwMsg('✅ Password changed successfully!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) }
      else setPwMsg(`❌ ${data.error}`)
    } catch { setPwMsg('❌ Failed to change password') }
    finally { setPwSaving(false); setTimeout(() => setPwMsg(''), 5000) }
  }

  const inp = 'w-full px-4 py-3 rounded-xl border font-space text-sm outline-none transition-colors'
  const inpStyle = { borderColor: 'var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text-1)' }

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-1/30 border-t-accent-1 rounded-full animate-spin" />
        <p style={{ color: 'var(--color-text-3)' }} className="font-space text-sm">Loading settings...</p>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sora font-bold text-3xl" style={{ color: 'var(--color-text-1)' }}>Site Settings</h1>
          <p style={{ color: 'var(--color-text-3)' }} className="mt-1 font-space text-sm">Manage everything that appears on your website from here.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 rounded-xl text-white font-space font-semibold text-sm disabled:opacity-60 transition-all"
          style={{ background: 'linear-gradient(135deg, var(--color-accent-1), var(--color-accent-3))' }}>
          {saving ? 'Saving...' : '💾 Save All Changes'}
        </button>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-space ${msg.startsWith('✅') ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
          {msg}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-2 flex-wrap mb-8 p-1 rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-space text-sm transition-all duration-200"
            style={activeTab === tab.id
              ? { background: 'var(--color-accent-1)', color: '#fff' }
              : { color: 'var(--color-text-2)', background: 'transparent' }}>
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="rounded-2xl border p-8" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>

        {/* CONTACT */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <h2 className="font-sora font-bold text-xl mb-6" style={{ color: 'var(--color-text-1)' }}>Contact Information</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-3)' }}>This information appears in the contact section and footer of your website.</p>
            <div className="grid grid-cols-2 gap-5">
              {[
                { key: 'email', label: 'Email Address', placeholder: 'zafarjahangeer512@gmail.com', type: 'email', tip: 'Shown on site and used for form notifications' },
                { key: 'whatsapp', label: 'WhatsApp Number', placeholder: '+923428283671', type: 'text', tip: 'Include country code (e.g. +92...)' },
              ].map(({ key, label, placeholder, type, tip }) => (
                <div key={key}>
                  <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>{label}</label>
                  <input type={type} value={(settings as Record<string,unknown>)[key] as string}
                    onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                    placeholder={placeholder} className={inp} style={inpStyle} />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-3)' }}>{tip}</p>
                </div>
              ))}
            </div>
            <div>
              <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Availability Status</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setSettings(s => ({ ...s, isAvailable: !s.isAvailable }))}
                    className="relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer"
                    style={{ background: settings.isAvailable ? 'var(--color-accent-1)' : 'var(--color-border)' }}>
                    <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200"
                      style={{ left: settings.isAvailable ? '28px' : '4px' }} />
                  </div>
                  <span className="font-space text-sm" style={{ color: 'var(--color-text-1)' }}>
                    {settings.isAvailable ? '🟢 Currently Available' : '🔴 Not Available'}
                  </span>
                </label>
              </div>
              <div className="mt-3">
                <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Availability Text (shown on site)</label>
                <input value={settings.availabilityText}
                  onChange={e => setSettings(s => ({ ...s, availabilityText: e.target.value }))}
                  placeholder="Currently accepting new projects" className={inp} style={inpStyle} />
              </div>
            </div>
          </div>
        )}

        {/* SOCIALS */}
        {activeTab === 'socials' && (
          <div>
            <h2 className="font-sora font-bold text-xl mb-2" style={{ color: 'var(--color-text-1)' }}>Social Media Links</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-3)' }}>These links appear in the contact section and footer. Leave blank to hide.</p>
            <div className="grid grid-cols-2 gap-5">
              {[
                { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', icon: '📸' },
                { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel', icon: '▶️' },
                { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle', icon: '🎵' },
                { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourprofile', icon: '💼' },
                { key: 'behance', label: 'Behance', placeholder: 'https://behance.net/yourprofile', icon: '🎨' },
                { key: 'twitter', label: 'X / Twitter', placeholder: 'https://twitter.com/yourhandle', icon: '𝕏' },
              ].map(({ key, label, placeholder, icon }) => (
                <div key={key}>
                  <label className="flex items-center gap-2 font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>
                    <span>{icon}</span> {label}
                  </label>
                  <input type="url" value={(settings as Record<string,unknown>)[key] as string}
                    onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                    placeholder={placeholder} className={inp} style={inpStyle} />
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}>
              <p className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>
                💡 <strong style={{ color: 'var(--color-text-2)' }}>Tip:</strong> After saving, these will appear in your contact section and footer automatically. Only links with a URL will be shown.
              </p>
            </div>
          </div>
        )}

        {/* HERO */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <h2 className="font-sora font-bold text-xl mb-2" style={{ color: 'var(--color-text-1)' }}>Hero Section Content</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-3)' }}>Controls the first thing visitors see when they land on your site.</p>
            <div>
              <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Main Headline</label>
              <input value={settings.heroHeadline}
                onChange={e => setSettings(s => ({ ...s, heroHeadline: e.target.value }))}
                placeholder="We Build Brands" className={inp} style={inpStyle} />
            </div>
            <div>
              <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Sub Headline</label>
              <textarea value={settings.heroSubtext}
                onChange={e => setSettings(s => ({ ...s, heroSubtext: e.target.value }))}
                rows={3} placeholder="Video editing, motion graphics..." className={`${inp} resize-none`} style={inpStyle} />
            </div>
            <div>
              <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>
                Rotating Words (comma separated)
              </label>
              <input value={rotatingWordInput}
                onChange={e => setRotatingWordInput(e.target.value)}
                placeholder="Move People, Drive Growth, Go Viral, Build Empires" className={inp} style={inpStyle} />
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-3)' }}>
                These words rotate in the animated headline. Current: {rotatingWordInput.split(',').filter(s => s.trim()).map(s => `"${s.trim()}"`).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* ABOUT */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <h2 className="font-sora font-bold text-xl mb-2" style={{ color: 'var(--color-text-1)' }}>About Section</h2>
            <div>
              <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Bio / Story</label>
              <textarea value={settings.aboutBio}
                onChange={e => setSettings(s => ({ ...s, aboutBio: e.target.value }))}
                rows={5} placeholder="Tell your story..." className={`${inp} resize-none`} style={inpStyle} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Years of Experience</label>
                <input type="number" value={settings.yearsExperience}
                  onChange={e => setSettings(s => ({ ...s, yearsExperience: +e.target.value }))}
                  className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Based In</label>
                <input value={settings.basedIn}
                  onChange={e => setSettings(s => ({ ...s, basedIn: e.target.value }))}
                  placeholder="Pakistan" className={inp} style={inpStyle} />
              </div>
            </div>
          </div>
        )}

        {/* SEO */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <h2 className="font-sora font-bold text-xl mb-2" style={{ color: 'var(--color-text-1)' }}>SEO & Branding</h2>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Brand Name</label>
                <input value={settings.brandName}
                  onChange={e => setSettings(s => ({ ...s, brandName: e.target.value }))}
                  placeholder="NGRX Studio" className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Tagline</label>
                <input value={settings.tagline}
                  onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))}
                  placeholder="Frame every second." className={inp} style={inpStyle} />
              </div>
            </div>
            <div>
              <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>SEO Title (browser tab)</label>
              <input value={settings.seoTitle}
                onChange={e => setSettings(s => ({ ...s, seoTitle: e.target.value }))}
                placeholder="NGRX Studio — Frame Every Second" className={inp} style={inpStyle} />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-3)' }}>{settings.seoTitle.length}/60 chars recommended</p>
            </div>
            <div>
              <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>SEO Description</label>
              <textarea value={settings.seoDescription}
                onChange={e => setSettings(s => ({ ...s, seoDescription: e.target.value }))}
                rows={3} className={`${inp} resize-none`} style={inpStyle} />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-3)' }}>{settings.seoDescription.length}/160 chars recommended</p>
            </div>
          </div>
        )}

        {/* SECURITY */}
        {activeTab === 'security' && (
          <div>
            <h2 className="font-sora font-bold text-xl mb-2" style={{ color: 'var(--color-text-1)' }}>Admin Security</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-3)' }}>Change your admin account password.</p>

            {pwMsg && (
              <div className={`mb-4 p-3 rounded-xl border text-sm font-space ${pwMsg.startsWith('✅') ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                {pwMsg}
              </div>
            )}

            <div className="max-w-md space-y-4">
              {[
                { key: 'currentPassword', label: 'Current Password' },
                { key: 'newPassword', label: 'New Password' },
                { key: 'confirmPassword', label: 'Confirm New Password' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>{label}</label>
                  <input type="password"
                    value={(pwForm as Record<string,string>)[key]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="••••••••" className={inp} style={inpStyle} />
                </div>
              ))}
              <button onClick={handlePasswordChange} disabled={pwSaving}
                className="px-6 py-3 rounded-xl text-white font-space font-semibold text-sm w-full disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg, var(--color-accent-1), var(--color-accent-3))' }}>
                {pwSaving ? 'Updating...' : '🔐 Update Password'}
              </button>
            </div>

            <div className="mt-8 p-5 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}>
              <h3 className="font-space font-semibold mb-2" style={{ color: 'var(--color-text-1)' }}>Current Admin Credentials</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>Email:</span>
                  <code className="font-mono text-sm px-2 py-0.5 rounded" style={{ background: 'var(--color-void)', color: 'var(--color-accent-2)' }}>
                    zafarjahangeer512@gmail.com
                  </code>
                </div>
                <p className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>Use the form above to change your password anytime.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

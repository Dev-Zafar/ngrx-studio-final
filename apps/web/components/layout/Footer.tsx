'use client'
import { useEffect, useState } from 'react'

interface Settings { email: string; whatsapp: string; instagram: string; youtube: string; linkedin: string; behance: string; tiktok: string; twitter: string; tagline: string }

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'youtube', label: 'YouTube', icon: '▶️' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { key: 'behance', label: 'Behance', icon: '🎨' },
]

const Logo = () => (
  <div className="flex items-center gap-2 mb-4">
    <svg width="100" height="32" viewBox="0 0 100 32" fill="none">
      <text x="0" y="27" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="28" fill="var(--color-text-1)" letterSpacing="-1">NGR</text>
      <text x="70" y="27" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="28" fill="url(#ftXG)" letterSpacing="-1">X</text>
      <defs>
        <linearGradient id="ftXG" x1="70" y1="0" x2="100" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
        </linearGradient>
      </defs>
    </svg>
    <span className="font-mono text-[10px] tracking-[0.3em] uppercase border-l pl-2"
      style={{ color: 'var(--color-text-3)', borderColor: 'var(--color-border)' }}>Studio</span>
  </div>
)

export function Footer() {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    fetch(`${api}/settings`).then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const activeSocials = SOCIALS.filter(s => settings && (settings as Record<string,string>)[s.key])

  return (
    <footer className="border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-void)' }}>
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="text-sm leading-relaxed max-w-xs mb-5" style={{ color: 'var(--color-text-2)' }}>
              Specialist in cutting long-form content into high-retention Shorts, Reels, and TikToks. Every second earns its place.
            </p>
            <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-3)' }}>
              {settings?.tagline || 'Frame every second.'}
            </p>
            {/* Socials */}
            {activeSocials.length > 0 && (
              <div className="flex gap-3 mt-6">
                {activeSocials.map(s => (
                  <a key={s.key}
                    href={(settings as Record<string,string>)[s.key]}
                    target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg border flex items-center justify-center text-sm transition-all duration-200"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                    title={s.label}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-accent-1)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(124,58,237,0.1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-surface)' }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <h4 className="font-mono text-xs tracking-[0.2em] uppercase mb-5" style={{ color: 'var(--color-text-3)' }}>Services</h4>
            <ul className="space-y-3">
              {['Short-Form Editing', 'Podcast Clipping', 'YouTube Editing', 'Motion Graphics', 'Content Strategy'].map(s => (
                <li key={s}><a href="#services" className="text-sm transition-colors duration-200"
                  style={{ color: 'var(--color-text-2)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-1)'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-2)'}>{s}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-mono text-xs tracking-[0.2em] uppercase mb-5" style={{ color: 'var(--color-text-3)' }}>Contact</h4>
            <ul className="space-y-3">
              <li><a href={`mailto:${settings?.email || 'zafarjahangeer512@gmail.com'}`}
                className="text-sm transition-colors" style={{ color: 'var(--color-text-2)' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-1)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-2)'}>
                {settings?.email || 'zafarjahangeer512@gmail.com'}
              </a></li>
              <li><a href={`https://wa.me/${(settings?.whatsapp || '+923428283671').replace(/[^0-9]/g,'')}`}
                target="_blank" rel="noopener noreferrer"
                className="text-sm transition-colors" style={{ color: 'var(--color-text-2)' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-1)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-2)'}>
                WhatsApp
              </a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--color-border)' }}>
          <p className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>© {new Date().getFullYear()} NGRX Studio. All rights reserved.</p>
          <p className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>Built by Muhammad Zafar Jahangir</p>
        </div>
      </div>
    </footer>
  )
}

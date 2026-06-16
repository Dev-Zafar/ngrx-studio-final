'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn, RevealText } from '@/components/animations/RevealText'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  budget: z.string().min(1, 'Please select a budget'),
  services: z.array(z.string()).min(1, 'Select at least one service'),
  brief: z.string().min(20, 'Brief must be at least 20 characters').max(500),
})
type FormData = z.infer<typeof schema>

interface SiteSettings {
  email: string; whatsapp: string
  instagram: string; youtube: string; linkedin: string
  behance: string; tiktok: string; twitter: string
  availabilityText: string; isAvailable: boolean
}

const serviceOptions = ['Video Editing (Shorts/Reels)', 'Podcast Clipping', 'YouTube Editing', 'TikTok Content', 'Motion Graphics', 'Graphic Design', 'Social Media Mgmt', 'Content Strategy']
const budgetOptions = ['Under $500', '$500 – $2,000', '$2,000 – $5,000', '$5,000+']

const SOCIAL_CONFIG = [
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'youtube', label: 'YouTube', icon: '▶️' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { key: 'behance', label: 'Behance', icon: '🎨' },
  { key: 'twitter', label: 'X / Twitter', icon: '𝕏' },
]

export function ContactSection() {
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    fetch(`${api}/settings`).then(r => r.json()).then(setSiteSettings).catch(() => {})
  }, [])

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { services: [] },
  })

  const selectedServices = watch('services') || []
  const toggleService = (s: string) => {
    setValue('services', selectedServices.includes(s)
      ? selectedServices.filter(x => x !== s)
      : [...selectedServices, s])
  }

  const onSubmit = async (data: FormData) => {
    setStatus('loading')
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const res = await fetch(`${api}/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Failed')
      setStatus('success')
      reset()
      setTimeout(() => setStatus('idle'), 5000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const whatsapp = siteSettings?.whatsapp || '+923428283671'
  const email = siteSettings?.email || 'zafarjahangeer512@gmail.com'
  const activeSocials = SOCIAL_CONFIG.filter(s => siteSettings && (siteSettings as Record<string,string>)[s.key])

  const inp = 'w-full px-4 py-3 rounded-xl border font-space text-sm outline-none transition-colors'
  const inpStyle = { borderColor: 'var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text-1)' }

  return (
    <section id="contact" className="section-padding" style={{ background: 'var(--color-void)' }}>
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — Form */}
          <div>
            <FadeIn>
              <span className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--color-accent-2)' }}>Contact</span>
            </FadeIn>
            <RevealText as="h2" className="font-sora font-extrabold mt-4 mb-3 leading-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-text-1)' }}>
              Let's build something great.
            </RevealText>
            <FadeIn delay={0.2}>
              <p className="mb-10" style={{ color: 'var(--color-text-2)' }}>Fill in the brief below and I'll reply within 24 hours.</p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  {(['name','email'] as const).map(field => (
                    <div key={field}>
                      <label className="block font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>
                        {field === 'name' ? 'Name' : 'Email'}
                      </label>
                      <input {...register(field)} placeholder={field === 'name' ? 'Your name' : 'your@email.com'} type={field === 'email' ? 'email' : 'text'}
                        className={inp} style={inpStyle} />
                      {errors[field] && <p className="text-red-400 text-xs mt-1">{errors[field]?.message}</p>}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Budget Range</label>
                  <select {...register('budget')} className={inp} style={{ ...inpStyle, appearance: 'none' }}>
                    <option value="">Select budget...</option>
                    {budgetOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {errors.budget && <p className="text-red-400 text-xs mt-1">{errors.budget.message}</p>}
                </div>

                <div>
                  <label className="block font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--color-text-3)' }}>Services Needed</label>
                  <div className="flex flex-wrap gap-2">
                    {serviceOptions.map(s => (
                      <button key={s} type="button" onClick={() => toggleService(s)}
                        className="px-3 py-2 rounded-lg border text-sm font-space transition-all duration-200"
                        style={selectedServices.includes(s)
                          ? { borderColor: 'var(--color-accent-1)', background: 'rgba(124,58,237,0.12)', color: 'var(--color-accent-1)' }
                          : { borderColor: 'var(--color-border)', background: 'transparent', color: 'var(--color-text-2)' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {errors.services && <p className="text-red-400 text-xs mt-1">{errors.services.message}</p>}
                </div>

                <div>
                  <label className="block font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>Project Brief</label>
                  <textarea {...register('brief')} rows={4}
                    placeholder="Tell me about your content — platform, style, audience, and what results you want..." 
                    className={`${inp} resize-none`} style={inpStyle} />
                  <div className="flex justify-between mt-1">
                    {errors.brief ? <p className="text-red-400 text-xs">{errors.brief.message}</p> : <span />}
                    <span className="text-xs font-mono" style={{ color: 'var(--color-text-3)' }}>{watch('brief')?.length || 0}/500</span>
                  </div>
                </div>

                <button type="submit" disabled={status === 'loading'}
                  className="w-full py-4 rounded-xl text-white font-space font-semibold text-base disabled:opacity-60 transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, var(--color-accent-1), var(--color-accent-3))' }}>
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending...
                    </span>
                  ) : 'Send Brief →'}
                </button>

                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-space text-center">
                      ✅ Brief received! I'll be in touch within 24 hours.
                    </motion.div>
                  )}
                  {status === 'error' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-space text-center">
                      ❌ Something went wrong. Please WhatsApp directly.
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </FadeIn>
          </div>

          {/* Right — Info */}
          <FadeIn delay={0.2} className="lg:pt-20">
            <div className="space-y-5">
              {/* Contact cards */}
              <a href={`mailto:${email}`}
                className="flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 group"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(124,58,237,0.3)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'}>
                <div className="w-11 h-11 rounded-xl border flex items-center justify-center text-xl" style={{ borderColor: 'var(--color-border)' }}>✉️</div>
                <div>
                  <div className="font-mono text-xs tracking-wider uppercase" style={{ color: 'var(--color-text-3)' }}>Email</div>
                  <div className="font-space" style={{ color: 'var(--color-text-1)' }}>{email}</div>
                </div>
              </a>

              <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(34,197,94,0.3)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'}>
                <div className="w-11 h-11 rounded-xl border flex items-center justify-center text-xl" style={{ borderColor: 'var(--color-border)' }}>💬</div>
                <div>
                  <div className="font-mono text-xs tracking-wider uppercase" style={{ color: 'var(--color-text-3)' }}>WhatsApp</div>
                  <div className="font-space" style={{ color: 'var(--color-text-1)' }}>{whatsapp}</div>
                </div>
              </a>

              {/* Availability */}
              <div className="p-5 rounded-2xl border" style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.05)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-mono text-xs tracking-wider uppercase text-green-400">
                    {siteSettings?.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-2)' }}>
                  {siteSettings?.availabilityText || 'Currently accepting new projects'}. Response within 24 hours.
                </p>
              </div>

              {/* Socials — dynamically from DB */}
              {activeSocials.length > 0 && (
                <div>
                  <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--color-text-3)' }}>Follow the work</p>
                  <div className="grid grid-cols-2 gap-2">
                    {activeSocials.map(s => (
                      <a key={s.key}
                        href={(siteSettings as Record<string,string>)[s.key]}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200"
                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(124,58,237,0.3)'}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'}>
                        <span>{s.icon}</span>
                        <span className="font-space text-sm" style={{ color: 'var(--color-text-2)' }}>{s.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

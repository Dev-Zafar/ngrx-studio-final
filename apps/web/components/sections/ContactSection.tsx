'use client'
import { useState } from 'react'
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
  brief: z.string().min(20, 'Brief must be at least 20 characters').max(500, 'Max 500 characters'),
})

type FormData = z.infer<typeof schema>

const serviceOptions = ['Video Editing', 'Motion Graphics', 'Graphic Design', 'Social Media Mgmt', 'Content Strategy']
const budgetOptions = ['Under $500', '$500 – $2,000', '$2,000 – $5,000', '$5,000+']

const socialLinks = [
  { label: 'Instagram', icon: '📸', href: '#' },
  { label: 'YouTube', icon: '▶️', href: '#' },
  { label: 'LinkedIn', icon: '💼', href: '#' },
  { label: 'Behance', icon: '🎨', href: '#' },
]

export function ContactSection() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { services: [] },
  })

  const selectedServices = watch('services') || []

  const toggleService = (service: string) => {
    const current = selectedServices
    if (current.includes(service)) {
      setValue('services', current.filter((s) => s !== service))
    } else {
      setValue('services', [...current, service])
    }
  }

  const onSubmit = async (data: FormData) => {
    setStatus('loading')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('success')
      reset()
      setTimeout(() => setStatus('idle'), 5000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <section id="contact" className="section-padding bg-void">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — Form */}
          <div>
            <FadeIn>
              <span className="font-mono text-xs text-accent-2 tracking-[0.3em] uppercase">Contact</span>
            </FadeIn>
            <RevealText
              as="h2"
              className="font-sora font-extrabold text-text-1 mt-4 mb-3 leading-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' } as React.CSSProperties}
            >
              Let's build something great.
            </RevealText>
            <FadeIn delay={0.2}>
              <p className="text-text-2 mb-10">Fill in the brief below and I'll get back to you within 24 hours.</p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Name + Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs text-text-3 tracking-widest uppercase mb-2">Name</label>
                    <input
                      {...register('name')}
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface/60 text-text-1 placeholder-text-3 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-text-3 tracking-widest uppercase mb-2">Email</label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface/60 text-text-1 placeholder-text-3 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors"
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block font-mono text-xs text-text-3 tracking-widest uppercase mb-2">Budget Range</label>
                  <select
                    {...register('budget')}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface/60 text-text-1 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors appearance-none"
                  >
                    <option value="" className="bg-surface">Select budget...</option>
                    {budgetOptions.map((b) => (
                      <option key={b} value={b} className="bg-surface">{b}</option>
                    ))}
                  </select>
                  {errors.budget && <p className="text-red-400 text-xs mt-1">{errors.budget.message}</p>}
                </div>

                {/* Services */}
                <div>
                  <label className="block font-mono text-xs text-text-3 tracking-widest uppercase mb-3">Services Needed</label>
                  <div className="flex flex-wrap gap-2">
                    {serviceOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleService(s)}
                        className={`px-4 py-2 rounded-lg border text-sm font-space transition-all duration-200 ${
                          selectedServices.includes(s)
                            ? 'border-accent-1 bg-accent-1/15 text-accent-1'
                            : 'border-border bg-surface/40 text-text-2 hover:border-accent-1/40'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {errors.services && <p className="text-red-400 text-xs mt-1">{errors.services.message}</p>}
                </div>

                {/* Brief */}
                <div>
                  <label className="block font-mono text-xs text-text-3 tracking-widest uppercase mb-2">
                    Project Brief
                  </label>
                  <textarea
                    {...register('brief')}
                    rows={4}
                    placeholder="Tell me about your project, goals, and timeline..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface/60 text-text-1 placeholder-text-3 font-space text-sm focus:outline-none focus:border-accent-1/60 transition-colors resize-none"
                  />
                  <div className="flex justify-between mt-1">
                    {errors.brief
                      ? <p className="text-red-400 text-xs">{errors.brief.message}</p>
                      : <span />
                    }
                    <span className="text-text-3 text-xs font-mono">
                      {watch('brief')?.length || 0}/500
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-1 to-accent-3 text-white font-space font-semibold text-base hover:shadow-lg hover:shadow-accent-1/30 transition-all duration-300 disabled:opacity-60"
                >
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

                {/* Status messages */}
                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-space text-center"
                    >
                      ✅ Brief received! I'll be in touch within 24 hours.
                    </motion.div>
                  )}
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-space text-center"
                    >
                      ❌ Something went wrong. Please try again or WhatsApp directly.
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </FadeIn>
          </div>

          {/* Right — Info */}
          <FadeIn delay={0.2} className="lg:pt-20">
            <div className="space-y-6">
              {/* Contact cards */}
              {[
                { label: 'Email', val: 'hello@ngrxstudio.com', icon: '✉️', href: 'mailto:hello@ngrxstudio.com' },
                { label: 'WhatsApp', val: '+92 300 1234567', icon: '💬', href: 'https://wa.me/923001234567' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-surface/40 hover:border-accent-1/30 transition-all duration-300 group"
                >
                  <div className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-xl">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-mono text-xs text-text-3 tracking-wider uppercase">{item.label}</div>
                    <div className="font-space text-text-1 group-hover:text-accent-2 transition-colors">{item.val}</div>
                  </div>
                </a>
              ))}

              {/* Availability badge */}
              <div className="p-5 rounded-2xl border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-mono text-xs text-green-400 tracking-wider uppercase">Currently Available</span>
                </div>
                <p className="text-text-2 text-sm">Accepting new projects for Q3 2024. Response time: within 24 hours.</p>
              </div>

              {/* Social links */}
              <div>
                <p className="font-mono text-xs text-text-3 tracking-widest uppercase mb-4">Follow the work</p>
                <div className="grid grid-cols-2 gap-3">
                  {socialLinks.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:border-accent-1/30 transition-all duration-200"
                    >
                      <span>{s.icon}</span>
                      <span className="font-space text-sm text-text-2">{s.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

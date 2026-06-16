'use client'
import { useEffect, useState } from 'react'
import { FadeIn, RevealText } from '@/components/animations/RevealText'

interface Settings {
  aboutBio: string
  yearsExperience: number
  basedIn: string
  email: string
  whatsapp: string
}

const timeline = [
  { year: '2020', event: 'Started freelancing — cutting podcasts & long videos into viral Shorts' },
  { year: '2021', event: 'Crossed 10 international clients across 3 continents' },
  { year: '2022', event: 'Expanded into full content strategy & brand identity' },
  { year: '2024', event: 'NGRX Studio officially launched as a global creative agency' },
]

const skills = ['Podcast Clipping', 'Short-Form Editing', 'YouTube Editing', 'TikTok / Reels', 'Motion Graphics', 'Content Strategy']

const statItems = [
  { val: '120+', label: 'Projects Delivered' },
  { val: '47', label: 'Happy Clients' },
  { val: '28M+', label: 'Views Generated' },
  { val: '4.9★', label: 'Client Rating' },
]

export function AboutSection() {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    fetch(`${api}/settings`).then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const bio = settings?.aboutBio || "I'm Muhammad Zafar Jahangir — specialist in cutting podcasts, interviews, and long-form videos into high-retention Shorts, Reels, and TikToks that dominate feeds across YouTube, Instagram, TikTok, and LinkedIn."

  return (
    <section id="about" className="section-padding" style={{ background: 'var(--color-void)' }}>
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* Left */}
          <div>
            <FadeIn>
              <span className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--color-accent-2)' }}>About</span>
            </FadeIn>
            <RevealText as="h2" className="font-sora font-extrabold mt-4 mb-8 leading-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'var(--color-text-1)' }}>
              Precision craft. Global impact.
            </RevealText>
            <FadeIn delay={0.2}>
              <p className="leading-relaxed mb-5" style={{ fontSize: 'clamp(1rem, 1.4vw, 1.1rem)', color: 'var(--color-text-2)' }}>
                {bio}
              </p>
              <p className="leading-relaxed mb-10" style={{ fontSize: 'clamp(1rem, 1.4vw, 1.1rem)', color: 'var(--color-text-2)' }}>
                Every second of content is intentional. No filler, no fluff — just content that hooks, holds, and converts.
              </p>
            </FadeIn>

            {/* Stats grid */}
            <FadeIn delay={0.3}>
              <div className="grid grid-cols-2 gap-4 mb-10">
                {statItems.map(s => (
                  <div key={s.label} className="p-5 rounded-xl border" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                    <div className="font-sora text-2xl font-extrabold mb-1"
                      style={{ background: 'linear-gradient(135deg, var(--color-accent-1), var(--color-accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {s.val}
                    </div>
                    <div className="font-mono text-xs tracking-wider uppercase" style={{ color: 'var(--color-text-3)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Location badges */}
            <FadeIn delay={0.4}>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-1.5 rounded-full border font-mono text-xs"
                  style={{ borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.07)', color: 'var(--color-accent-1)' }}>
                  📍 Based in {settings?.basedIn || 'Pakistan'}
                </span>
                <span className="px-4 py-1.5 rounded-full border font-mono text-xs"
                  style={{ borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.07)', color: 'var(--color-accent-2)' }}>
                  🌍 Working Globally
                </span>
              </div>
            </FadeIn>
          </div>

          {/* Right — Timeline */}
          <div>
            <FadeIn delay={0.1}>
              <h3 className="font-space font-semibold text-sm tracking-widest uppercase mb-10"
                style={{ color: 'var(--color-text-2)' }}>The Journey</h3>
            </FadeIn>

            <div className="relative">
              <div className="absolute left-[42px] top-0 bottom-0 w-px"
                style={{ background: 'linear-gradient(to bottom, var(--color-accent-1), rgba(6,182,212,0.2), transparent)' }} />
              <div className="space-y-10">
                {timeline.map((item, i) => (
                  <FadeIn key={item.year} delay={0.15 + i * 0.1} direction="right">
                    <div className="flex gap-6 items-start">
                      <div className="relative flex-shrink-0">
                        <div className="w-[84px] h-[42px] rounded-full border flex items-center justify-center"
                          style={{ borderColor: 'rgba(124,58,237,0.3)', background: 'var(--color-surface)' }}>
                          <span className="font-mono text-xs font-medium" style={{ color: 'var(--color-accent-1)' }}>{item.year}</span>
                        </div>
                      </div>
                      <div className="pt-2.5">
                        <p className="font-space text-sm leading-relaxed" style={{ color: 'var(--color-text-1)' }}>{item.event}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>

            {/* Skills */}
            <FadeIn delay={0.6} className="mt-14">
              <h3 className="font-space font-semibold text-sm tracking-widest uppercase mb-5"
                style={{ color: 'var(--color-text-2)' }}>Core Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <span key={skill} className="px-4 py-2 rounded-lg border font-space text-sm transition-colors duration-200"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-2)' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  )
}

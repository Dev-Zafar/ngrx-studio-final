'use client'
import React from 'react'
import { useEffect, useState } from 'react'
import { FadeIn, RevealText } from '@/components/animations/RevealText'
import { motion } from 'framer-motion'
import { DynamicIcon } from '../ui/IconMap'

interface Service { _id: string; title: string; icon: string; shortDescription: string; deliverables: string[]; order: number }

const FALLBACK: Service[] = [
  { _id: '1', title: 'Short-Form Editing', icon: 'scissors', shortDescription: 'Cutting podcasts, interviews, and long videos into viral Shorts, Reels, and TikToks with scroll-stopping hooks.', deliverables: ['YouTube Shorts', 'Instagram Reels', 'TikTok Videos', 'LinkedIn Clips'], order: 1 },
  { _id: '2', title: 'Podcast Clipping', icon: 'mic', shortDescription: 'Extracting the best moments from long podcast episodes and turning them into shareable social content.', deliverables: ['Audiogram clips', 'Quote cards', 'Highlight reels', 'Multi-platform cuts'], order: 2 },
  { _id: '3', title: 'YouTube Editing', icon: 'monitor-play', shortDescription: 'Full long-form YouTube video editing with retention-optimised pacing, b-roll, and motion graphics.', deliverables: ['Long-form editing', 'Thumbnail design', 'End screens', 'Color grading'], order: 3 },
  { _id: '4', title: 'Motion Graphics', icon: 'sparkles', shortDescription: 'Animated text, transitions, and visual effects that make content feel premium and professional.', deliverables: ['Kinetic typography', 'Animated intros', 'Lower thirds', 'Logo animations'], order: 4 },
  { _id: '5', title: 'Graphic Design', icon: 'paintbrush', shortDescription: 'Thumbnails, social posts, and brand assets designed to stop the scroll and communicate instantly.', deliverables: ['YouTube thumbnails', 'Social posts', 'Story templates', 'Brand assets'], order: 5 },
]

const ACCENTS = ['#7C3AED', '#06B6D4', '#A855F7', '#7C3AED', '#06B6D4']

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/services`)
      .then(r => r.json())
      .then(d => setServices(Array.isArray(d) && d.length > 0 ? d : FALLBACK))
      .catch(() => setServices(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  const displayed = [...(loading ? FALLBACK : services)].sort((a, b) => a.order - b.order)

  return (
    <section id="services" className="section-padding" style={{ background: 'var(--color-void)' }}>
      <div className="container-custom">
        <div className="max-w-2xl mb-16">
          <FadeIn>
            <span className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--color-accent-2)' }}>Services</span>
          </FadeIn>
          <RevealText as="h2" className="font-sora font-extrabold mt-4 leading-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'var(--color-text-1)' }}>
            Everything your brand needs to dominate.
          </RevealText>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((svc, i) => {
            const accent = ACCENTS[i % ACCENTS.length]
            return (
              <FadeIn key={svc._id} delay={i * 0.08} direction="up">
                <motion.div
                  className="group relative p-7 rounded-2xl h-full cursor-default overflow-hidden"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                  whileHover={{ y: -4, borderColor: accent + '50' }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(280px at 50% 50%, ${accent}0A, transparent)` }} />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-3xl text-[var(--color-text-1)]">
                        <DynamicIcon name={svc.icon} className="w-8 h-8" strokeWidth={1.5} />
                      </span>
                      <span className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>0{i + 1}</span>
                    </div>
                    <h3 className="font-sora font-bold text-lg mb-3 transition-colors duration-300"
                      style={{ color: 'var(--color-text-1)' }}>
                      {svc.title}
                    </h3>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-text-2)' }}>
                      {svc.shortDescription}
                    </p>
                    {svc.deliverables?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {svc.deliverables.map(d => (
                          <span key={d} className="px-2.5 py-1 rounded-md text-xs font-mono"
                            style={{ background: 'var(--color-border)', color: 'var(--color-text-3)' }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-sm font-space group-hover:gap-2.5 transition-all duration-200"
                      style={{ color: 'var(--color-text-3)' }}>
                      <span>Explore</span><span>→</span>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
                </motion.div>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}
'use client'
import React from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn, RevealText } from '@/components/animations/RevealText'
import { Search, Scissors, Clapperboard, RefreshCw, Rocket, Clock } from 'lucide-react'

const steps = [
  { num: '01', title: 'Discovery & Brief', desc: 'You share your content, goals, and platform focus. I audit what exists and map the strategy before touching a timeline.', details: ['Content audit','Platform strategy','Audience research','Style reference collection','Project brief sign-off'], icon: <Search size="1em" strokeWidth={1.5} />, duration: '1–2 days' },
  { num: '02', title: 'Clip Selection', desc: 'For podcasts and long videos, I identify the highest-value moments — hooks, insights, and emotional peaks — before editing begins.', details: ['Transcript review','Hook identification','Moment tagging','Sequence planning','Client approval'], icon: <Scissors size="1em" strokeWidth={1.5} />, duration: '1–2 days' },
  { num: '03', title: 'Editing & Production', desc: 'Full editing with captions, b-roll, music, color grading, and motion graphics. Every second earns its place.', details: ['Video editing','Caption design','Music selection','Color grading','Motion graphics'], icon: <Clapperboard size="1em" strokeWidth={1.5} />, duration: '3–7 days' },
  { num: '04', title: 'Review & Revision', desc: 'You review the cuts. I refine based on feedback with up to 3 revision rounds until it\'s exactly right.', details: ['Client review portal','Feedback integration','Up to 3 revisions','Quality assurance','Format optimisation'], icon: <RefreshCw size="1em" strokeWidth={1.5} />, duration: '2–3 days' },
  { num: '05', title: 'Delivery & Growth', desc: 'Files delivered in all required formats, platform-optimised. I monitor performance and iterate on what works.', details: ['Multi-format export','Platform-optimised specs','Analytics review','Performance report','Next sprint planning'], icon: <Rocket size="1em" strokeWidth={1.5} />, duration: 'Ongoing' },
]

export function ProcessSection() {
  const [active, setActive] = useState(0)

  return (
    <section id="process" className="section-padding" style={{ background: 'var(--color-surface)' }}>
      <div className="container-custom">
        <div className="text-center mb-16">
          <FadeIn><span className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--color-accent-2)' }}>Process</span></FadeIn>
          <RevealText as="h2" className="font-sora font-extrabold mt-4 leading-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'var(--color-text-1)' }}>
            How I work.
          </RevealText>
          <FadeIn delay={0.2}>
            <p className="max-w-lg mx-auto mt-4" style={{ color: 'var(--color-text-2)' }}>
              A 5-phase system refined across 120+ projects to deliver consistently exceptional results.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          {/* Step buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
            {steps.map((step, i) => (
              <button key={step.num} onClick={() => setActive(i)}
                className="relative p-4 rounded-xl border text-left transition-all duration-200"
                style={active === i
                  ? { borderColor: 'rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.1)' }
                  : { borderColor: 'var(--color-border)', background: 'transparent' }}
                onMouseEnter={e => { if (active !== i) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface2, var(--color-void))' }}
                onMouseLeave={e => { if (active !== i) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                <div className="text-2xl mb-2">{step.icon}</div>
                <div className="font-mono text-xs mb-1" style={{ color: 'var(--color-text-3)' }}>{step.num}</div>
                <div className="font-space font-semibold text-sm" style={{ color: active === i ? 'var(--color-text-1)' : 'var(--color-text-2)' }}>
                  {step.title}
                </div>
              </button>
            ))}
          </div>

          {/* Active detail */}
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-2xl border"
              style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'var(--color-void)' }}>
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{steps[active].icon}</span>
                    <div>
                      <span className="font-mono text-xs" style={{ color: 'var(--color-accent-1)' }}>{steps[active].num}</span>
                      <h3 className="font-sora font-bold text-xl" style={{ color: 'var(--color-text-1)' }}>{steps[active].title}</h3>
                    </div>
                  </div>
                  <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-2)' }}>{steps[active].desc}</p>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-xs"
                    style={{ borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.07)', color: 'var(--color-accent-2)' }}>
                    <Clock size="1.2em" strokeWidth={1.5} /> {steps[active].duration}
                  </span>
                </div>
                <div>
                  <h4 className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--color-text-3)' }}>What's included</h4>
                  <div className="space-y-2.5">
                    {steps[active].details.map((d, i) => (
                      <motion.div key={d} className="flex items-center gap-3 text-sm"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--color-accent-1)' }} />
                        <span style={{ color: 'var(--color-text-2)' }}>{d}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </FadeIn>
      </div>
    </section>
  )
}
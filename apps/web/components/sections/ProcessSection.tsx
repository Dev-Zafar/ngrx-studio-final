'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn, RevealText } from '@/components/animations/RevealText'

const steps = [
  {
    num: '01',
    title: 'Discovery & Strategy',
    desc: 'Deep-dive into your brand, audience, competitors, and goals. We map out a complete content strategy before creating a single asset.',
    details: ['Brand audit', 'Competitor analysis', 'Audience research', 'Goal mapping', 'Content brief'],
    icon: '🔍',
    duration: '1–2 days',
  },
  {
    num: '02',
    title: 'Content Creation',
    desc: 'Production phase — editing, design, motion graphics, and all creative assets built to the agreed brief and quality standard.',
    details: ['Video editing', 'Motion graphics', 'Graphic design', 'Thumbnail production', 'Caption writing'],
    icon: '🎬',
    duration: '3–7 days',
  },
  {
    num: '03',
    title: 'Review & Refinement',
    desc: 'You review the work. We refine based on your feedback with up to 3 revision rounds until it\'s exactly right.',
    details: ['Client review portal', 'Feedback integration', 'Up to 3 revisions', 'Quality check', 'File preparation'],
    icon: '🔄',
    duration: '2–3 days',
  },
  {
    num: '04',
    title: 'Optimization',
    desc: 'Before delivery, every asset is optimized for its platform — formats, aspect ratios, file sizes, and SEO metadata.',
    details: ['Platform optimization', 'Format exports', 'Metadata & SEO', 'A/B variants', 'Performance setup'],
    icon: '⚡',
    duration: '1 day',
  },
  {
    num: '05',
    title: 'Launch & Growth',
    desc: 'We publish, monitor performance, and iterate. The content goes live with a launch strategy designed to maximize initial reach.',
    details: ['Scheduled publishing', 'Launch strategy', 'Analytics monitoring', 'Performance report', 'Next cycle planning'],
    icon: '🚀',
    duration: 'Ongoing',
  },
]

export function ProcessSection() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section id="process" className="section-padding bg-surface/20">
      <div className="container-custom">
        <div className="text-center mb-16">
          <FadeIn>
            <span className="font-mono text-xs text-accent-2 tracking-[0.3em] uppercase">Process</span>
          </FadeIn>
          <RevealText
            as="h2"
            className="font-sora font-extrabold text-text-1 mt-4 leading-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' } as React.CSSProperties}
          >
            How we work.
          </RevealText>
          <FadeIn delay={0.2}>
            <p className="text-text-2 max-w-lg mx-auto mt-4">
              A proven 5-phase system refined across 120+ projects to deliver exceptional results, every time.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="grid lg:grid-cols-5 gap-3 mb-8">
            {steps.map((step, i) => (
              <button
                key={step.num}
                onClick={() => setActiveStep(i)}
                className={`relative p-4 rounded-xl border text-left transition-all duration-300 ${
                  activeStep === i
                    ? 'border-accent-1/60 bg-accent-1/10'
                    : 'border-border bg-surface/40 hover:border-border/80'
                }`}
              >
                {activeStep === i && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-accent-1/5"
                    layoutId="activeStep"
                  />
                )}
                <div className="relative z-10">
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <div className="font-mono text-xs text-text-3 mb-1">{step.num}</div>
                  <div className={`font-space font-semibold text-sm ${activeStep === i ? 'text-text-1' : 'text-text-2'}`}>
                    {step.title}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Active step detail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="p-8 rounded-2xl border border-accent-1/20 bg-surface/60"
            >
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{steps[activeStep].icon}</span>
                    <div>
                      <span className="font-mono text-xs text-accent-1">{steps[activeStep].num}</span>
                      <h3 className="font-sora font-bold text-xl text-text-1">{steps[activeStep].title}</h3>
                    </div>
                  </div>
                  <p className="text-text-2 leading-relaxed">{steps[activeStep].desc}</p>
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-2/30 bg-accent-2/5">
                    <span className="font-mono text-xs text-accent-2">⏱ {steps[activeStep].duration}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-mono text-xs text-text-3 tracking-widest uppercase mb-4">Deliverables</h4>
                  <div className="space-y-2">
                    {steps[activeStep].details.map((d, i) => (
                      <motion.div
                        key={d}
                        className="flex items-center gap-3 text-text-2 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-1 flex-shrink-0" />
                        {d}
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

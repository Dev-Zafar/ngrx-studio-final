'use client'
import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { FadeIn, RevealText } from '@/components/animations/RevealText'

const services = [
  {
    num: '01',
    title: 'Video Editing',
    desc: 'Cinematic cuts for YouTube, Reels, Shorts, and brand films. Every edit is engineered to retain attention and drive action.',
    icon: '🎬',
    accent: '#7C3AED',
  },
  {
    num: '02',
    title: 'Motion Graphics',
    desc: 'Animated title cards, transitions, and motion content that elevate raw footage into premium visual experiences.',
    icon: '✨',
    accent: '#06B6D4',
  },
  {
    num: '03',
    title: 'Graphic Design',
    desc: 'Thumbnails, social posts, and brand assets designed to stop the scroll and communicate at a glance.',
    icon: '🎨',
    accent: '#A855F7',
  },
  {
    num: '04',
    title: 'Social Media Management',
    desc: 'Full-stack content systems — strategy, scheduling, engagement, and growth analytics across all major platforms.',
    icon: '📱',
    accent: '#7C3AED',
  },
  {
    num: '05',
    title: 'Content Strategy',
    desc: 'Data-driven content roadmaps, repurposing frameworks, and SEO-aligned scripting for sustainable channel growth.',
    icon: '🚀',
    accent: '#06B6D4',
  },
]

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-100, 100], [8, -8]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-100, 100], [-8, 8]), { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <FadeIn delay={index * 0.1} direction="up">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
        className="group relative p-7 rounded-2xl border border-border bg-surface/60 hover:border-accent-1/40 transition-colors duration-500 cursor-pointer h-full"
      >
        {/* Glow on hover */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(400px circle at center, ${service.accent}08, transparent)` }}
        />

        <div className="relative z-10">
          {/* Number + Icon row */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-xs text-text-3 tracking-widest">{service.num}</span>
            <span className="text-2xl">{service.icon}</span>
          </div>

          {/* Title */}
          <h3 className="font-sora font-bold text-text-1 text-xl mb-3 group-hover:text-gradient transition-all duration-300">
            {service.title}
          </h3>

          {/* Description */}
          <p className="text-text-2 text-sm leading-relaxed mb-6">{service.desc}</p>

          {/* CTA */}
          <div className="flex items-center gap-2 text-text-3 text-sm font-space group-hover:text-accent-2 transition-colors duration-300">
            <span>Explore</span>
            <motion.span
              className="inline-block"
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
            >→</motion.span>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, ${service.accent}, transparent)` }}
        />
      </motion.div>
    </FadeIn>
  )
}

export function ServicesSection() {
  return (
    <section id="services" className="section-padding bg-void">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <FadeIn>
            <span className="font-mono text-xs text-accent-2 tracking-[0.3em] uppercase">Services</span>
          </FadeIn>
          <RevealText
            as="h2"
            className="font-sora font-extrabold text-text-1 mt-4 leading-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' } as React.CSSProperties}
          >
            Everything your brand needs to dominate.
          </RevealText>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service, i) => (
            <ServiceCard key={service.num} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'
import { useRef } from 'react'
import { useInView } from 'framer-motion'
import CountUp from 'react-countup'
import { FadeIn } from '@/components/animations/RevealText'

const stats = [
  { value: 120, suffix: '+', label: 'Projects Delivered', desc: 'Across video, design & strategy' },
  { value: 47, suffix: '', label: 'Happy Clients', desc: 'From 12 countries worldwide' },
  { value: 28, suffix: 'M+', label: 'Views Generated', desc: 'Combined across all platforms' },
  { value: 4.9, suffix: '★', label: 'Client Rating', desc: 'Average across all projects', decimals: 1 },
]

export function StatsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })

  return (
    <section ref={ref} className="section-padding bg-surface/30 border-y border-border">
      <div className="container-custom">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1} className="text-center">
              <div className="font-sora font-extrabold text-gradient mb-2" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
                {inView ? (
                  <CountUp
                    start={0}
                    end={stat.value}
                    duration={2.5}
                    decimals={stat.decimals ?? 0}
                    suffix={stat.suffix}
                    useEasing
                  />
                ) : (
                  <span>0{stat.suffix}</span>
                )}
              </div>
              <div className="font-space font-semibold text-text-1 text-base mb-1">{stat.label}</div>
              <div className="font-mono text-xs text-text-3">{stat.desc}</div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

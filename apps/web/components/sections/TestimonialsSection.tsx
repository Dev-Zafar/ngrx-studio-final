'use client'
import React from 'react'
import { useRef, useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { FadeIn, RevealText } from '@/components/animations/RevealText'

interface Testimonial { _id: string; name: string; role: string; company: string; quote: string; rating: number }

const FALLBACK: Testimonial[] = [
  { _id:'1', name:'James Whitfield', role:'Founder', company:'NovaCast Media', quote:"NGRX Studio completely transformed our brand. The editing quality is top 1%. Subscriber numbers speak for themselves.", rating: 5 },
  { _id:'2', name:'Sarah Chen', role:'CMO', company:'ByteStack Technologies', quote:"Our launch content outperformed every internal benchmark. The explainer video drove 60% of trial signups in Q1.", rating: 5 },
  { _id:'3', name:'Amir Hassan', role:'Creator', company:'FitPulse', quote:"2.1 million views in one month. Zafar understood the fitness audience immediately — editing that kept people watching.", rating: 5 },
  { _id:'4', name:'Emma Clarke', role:'Creative Director', company:'Luxe Threads Co.', quote:"Best ROI we've ever seen. Engagement nearly doubled within 6 weeks. The content genuinely feels premium.", rating: 5 },
  { _id:'5', name:'Ryan Kowalski', role:'CEO', company:'ZenFlow', quote:"They understood our brand voice on day one. The reels feel meditative yet engaging — a very rare balance.", rating: 5 },
  { _id:'6', name:'Priya Nair', role:'Head of Content', company:'EduSpark Academy', quote:"CTR jumped 45% in the first week. The thumbnail system they built means we produce consistently every time.", rating: 5 },
]

const AVATAR_COLORS = ['#7C3AED','#06B6D4','#A855F7','#F43F5E','#10B981','#F59E0B']

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: true })
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/testimonials?published=true`)
      .then(r => r.json())
      .then(d => setTestimonials(Array.isArray(d) && d.length > 0 ? d : FALLBACK))
      .catch(() => setTestimonials(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  const displayed = loading ? FALLBACK : testimonials

  return (
    <section id="testimonials" className="section-padding overflow-hidden" style={{ background: 'var(--color-void)' }}>
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <FadeIn><span className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--color-accent-2)' }}>Testimonials</span></FadeIn>
            <RevealText as="h2" className="font-sora font-extrabold mt-4 leading-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'var(--color-text-1)' }}>
              What clients say.
            </RevealText>
          </div>
          <FadeIn delay={0.2} className="flex gap-3">
            {[{ fn: scrollPrev, label: '←' }, { fn: scrollNext, label: '→' }].map(({ fn, label }) => (
              <button key={label} onClick={fn}
                className="w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-2)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.5)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-2)' }}>
                {label}
              </button>
            ))}
          </FadeIn>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-5">
            {displayed.map((t, i) => (
              <div key={t._id} className="flex-none w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                <div className="rounded-2xl p-7 h-full border transition-colors duration-300"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, si) => (
                      <span key={si} className="text-sm" style={{ color: si < t.rating ? '#fbbf24' : 'var(--color-border)' }}>★</span>
                    ))}
                  </div>
                  {/* Quote */}
                  <p className="text-sm leading-relaxed mb-7 italic" style={{ color: 'var(--color-text-1)' }}>"{t.quote}"</p>
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-sora font-bold text-sm text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${AVATAR_COLORS[i % AVATAR_COLORS.length]}, ${AVATAR_COLORS[(i+1) % AVATAR_COLORS.length]}80)` }}>
                      {t.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-space font-semibold text-sm" style={{ color: 'var(--color-text-1)' }}>{t.name}</div>
                      <div className="font-mono text-xs" style={{ color: 'var(--color-text-3)' }}>{t.role} @ {t.company}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

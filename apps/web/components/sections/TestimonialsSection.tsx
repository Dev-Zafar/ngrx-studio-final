'use client'
import { useRef, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { FadeIn, RevealText } from '@/components/animations/RevealText'

const testimonials = [
  {
    name: 'James Whitfield',
    role: 'Founder',
    company: 'NovaCast Media',
    location: 'Dubai, UAE',
    quote: 'NGRX Studio completely transformed our brand. The editing quality and attention to detail is in the top 1% of everything I\'ve seen. Subscriber numbers speak for themselves.',
    rating: 5,
    initials: 'JW',
    accent: '#7C3AED',
  },
  {
    name: 'Sarah Chen',
    role: 'CMO',
    company: 'ByteStack Technologies',
    location: 'San Francisco, USA',
    quote: 'Our SaaS launch content outperformed every internal benchmark we set. The explainer video alone drove 60% of our trial signups in the first quarter.',
    rating: 5,
    initials: 'SC',
    accent: '#06B6D4',
  },
  {
    name: 'Amir Hassan',
    role: 'Creator',
    company: 'FitPulse',
    location: 'London, UK',
    quote: '2.1 million views in one month speaks for itself. Zafar understood the fitness audience immediately and delivered editing that kept people watching.',
    rating: 5,
    initials: 'AH',
    accent: '#10B981',
  },
  {
    name: 'Emma Clarke',
    role: 'Creative Director',
    company: 'Luxe Threads Co.',
    location: 'New York, USA',
    quote: 'Best ROI we\'ve ever seen from a creative agency. Our engagement rate nearly doubled within 6 weeks. The content just feels premium and on-brand.',
    rating: 5,
    initials: 'EC',
    accent: '#F43F5E',
  },
  {
    name: 'Ryan Kowalski',
    role: 'CEO',
    company: 'ZenFlow',
    location: 'Toronto, Canada',
    quote: 'They understood our brand voice on day one. The reels they produced feel meditative yet engaging — a very difficult balance to strike. Rare talent.',
    rating: 5,
    initials: 'RK',
    accent: '#A855F7',
  },
  {
    name: 'Priya Nair',
    role: 'Head of Content',
    company: 'EduSpark Academy',
    location: 'Mumbai, India',
    quote: 'Click-through rate jumped 45% within the first week of the new thumbnails. The system they built means we can produce consistently without constant briefing.',
    rating: 5,
    initials: 'PN',
    accent: '#F59E0B',
  },
]

export function TestimonialsSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 })

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <section id="testimonials" className="section-padding bg-void overflow-hidden">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <FadeIn>
              <span className="font-mono text-xs text-accent-2 tracking-[0.3em] uppercase">Testimonials</span>
            </FadeIn>
            <RevealText
              as="h2"
              className="font-sora font-extrabold text-text-1 mt-4 leading-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' } as React.CSSProperties}
            >
              What clients say.
            </RevealText>
          </div>

          {/* Nav buttons */}
          <FadeIn delay={0.2} className="flex gap-3">
            <button
              onClick={scrollPrev}
              className="w-11 h-11 rounded-full border border-border hover:border-accent-1/50 flex items-center justify-center text-text-2 hover:text-text-1 transition-all duration-300"
            >
              ←
            </button>
            <button
              onClick={scrollNext}
              className="w-11 h-11 rounded-full border border-border hover:border-accent-1/50 flex items-center justify-center text-text-2 hover:text-text-1 transition-all duration-300"
            >
              →
            </button>
          </FadeIn>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="flex-none w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                <div className="glass rounded-2xl p-7 h-full border border-border/60 hover:border-accent-1/20 transition-colors duration-300">
                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {[...Array(t.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">★</span>
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-text-1 text-sm leading-relaxed mb-7 italic">"{t.quote}"</p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-sora font-bold text-sm text-white"
                      style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent}80)` }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-space font-semibold text-text-1 text-sm">{t.name}</div>
                      <div className="font-mono text-xs text-text-3">{t.role} @ {t.company}</div>
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

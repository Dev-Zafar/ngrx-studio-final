'use client'
import { FadeIn, RevealText } from '@/components/animations/RevealText'

const timeline = [
  { year: '2020', event: 'Started freelancing — video editing & motion graphics' },
  { year: '2021', event: 'Crossed 10 international clients across 3 continents' },
  { year: '2022', event: 'Expanded into brand identity & content strategy' },
  { year: '2024', event: 'NGRX Studio officially launched as a global creative agency' },
]

const skills = ['Video Editing', 'Motion Graphics', 'Graphic Design', 'Social Media Strategy', 'Content Systems']

export function AboutSection() {
  return (
    <section id="about" className="section-padding bg-void">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left */}
          <div>
            <FadeIn delay={0}>
              <span className="font-mono text-xs text-accent-2 tracking-[0.3em] uppercase">About</span>
            </FadeIn>

            <RevealText
              as="h2"
              className="font-sora font-extrabold text-text-1 mt-4 mb-8 leading-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' } as React.CSSProperties}
            >
              Precision craft. Global impact.
            </RevealText>

            <FadeIn delay={0.2}>
              <p className="text-text-2 leading-relaxed mb-8" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.1rem)' }}>
                I'm Muhammad Zafar Jahangir — founder of NGRX Studio. With 4+ years building content for international brands,
                I've refined a singular approach: every frame, every pixel, every second of content must earn its place.
              </p>
              <p className="text-text-2 leading-relaxed mb-10" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.1rem)' }}>
                NGRX Studio is where technical precision meets creative vision — producing content that doesn't just look good,
                it converts.
              </p>
            </FadeIn>

            {/* Stats */}
            <FadeIn delay={0.3}>
              <div className="grid grid-cols-2 gap-6 mb-10">
                {[
                  { val: '120+', label: 'Projects Delivered' },
                  { val: '47', label: 'Happy Clients' },
                  { val: '28M+', label: 'Views Generated' },
                  { val: '4.9★', label: 'Client Rating' },
                ].map((s) => (
                  <div key={s.label} className="p-5 rounded-xl border border-border bg-surface/40">
                    <div className="font-sora text-2xl font-extrabold text-gradient mb-1">{s.val}</div>
                    <div className="font-mono text-xs text-text-3 tracking-wider uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Location badges */}
            <FadeIn delay={0.4}>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-1.5 rounded-full border border-accent-1/30 bg-accent-1/5 font-mono text-xs text-accent-1 tracking-wider">
                  📍 Based in Pakistan
                </span>
                <span className="px-4 py-1.5 rounded-full border border-accent-2/30 bg-accent-2/5 font-mono text-xs text-accent-2 tracking-wider">
                  🌍 Working Globally
                </span>
              </div>
            </FadeIn>
          </div>

          {/* Right — Timeline */}
          <div>
            <FadeIn delay={0.1}>
              <h3 className="font-space font-semibold text-text-2 text-sm tracking-widest uppercase mb-10">
                The Journey
              </h3>
            </FadeIn>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[42px] top-0 bottom-0 w-px bg-gradient-to-b from-accent-1/50 via-accent-2/30 to-transparent" />

              <div className="space-y-10">
                {timeline.map((item, i) => (
                  <FadeIn key={item.year} delay={0.15 + i * 0.1} direction="right">
                    <div className="flex gap-6 items-start">
                      {/* Year bubble */}
                      <div className="relative flex-shrink-0">
                        <div className="w-[84px] h-[42px] rounded-full border border-accent-1/30 bg-surface flex items-center justify-center">
                          <span className="font-mono text-xs font-medium text-accent-1">{item.year}</span>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="pt-2.5">
                        <p className="text-text-1 font-space text-sm leading-relaxed">{item.event}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>

            {/* Skills */}
            <FadeIn delay={0.6} className="mt-14">
              <h3 className="font-space font-semibold text-text-2 text-sm tracking-widest uppercase mb-5">
                Core Expertise
              </h3>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 rounded-lg border border-border bg-surface/60 font-space text-sm text-text-2 hover:border-accent-1/40 hover:text-text-1 transition-all duration-200"
                  >
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

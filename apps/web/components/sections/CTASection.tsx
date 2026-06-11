'use client'
import { motion } from 'framer-motion'
import { FadeIn, RevealText } from '@/components/animations/RevealText'

export function CTASection() {
  return (
    <section className="section-padding relative overflow-hidden bg-void">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-1/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent-2/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-1/3 to-transparent" />
      </div>

      <div className="container-custom relative z-10 text-center">
        <FadeIn>
          <span className="font-mono text-xs text-accent-2 tracking-[0.3em] uppercase">Ready?</span>
        </FadeIn>

        <RevealText
          as="h2"
          className="font-sora font-extrabold text-text-1 mt-6 mb-6 mx-auto max-w-3xl leading-tight"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' } as React.CSSProperties}
        >
          Ready to grow your brand?
        </RevealText>

        <FadeIn delay={0.3}>
          <p className="text-text-2 max-w-xl mx-auto mb-12 leading-relaxed text-lg">
            Let's build content that converts attention into revenue. One brief, and we handle everything else.
          </p>
        </FadeIn>

        <FadeIn delay={0.4} className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#contact"
            className="group relative px-10 py-4 bg-gradient-to-r from-accent-1 to-accent-3 rounded-full font-space font-semibold text-white text-lg overflow-hidden hover:shadow-xl hover:shadow-accent-1/30 transition-all duration-300"
          >
            Start Your Project
          </a>
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-full border border-green-500/40 bg-green-500/5 text-green-400 font-space font-semibold hover:bg-green-500/10 hover:border-green-500/60 transition-all duration-300"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat on WhatsApp
          </a>
        </FadeIn>
      </div>
    </section>
  )
}

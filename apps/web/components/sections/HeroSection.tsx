'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const rotatingWords = ['Move People', 'Drive Growth', 'Go Viral', 'Build Empires']

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0)
  const [showScroll, setShowScroll] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Delay animations until after loader
    const t1 = setTimeout(() => setShowScroll(true), 3800)
    const t2 = setTimeout(() => setShowScroll(false), 7000)
    const interval = setInterval(() => setWordIndex((i) => (i + 1) % rotatingWords.length), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(interval) }
  }, [])

  if (!mounted) return (
    <section className="relative min-h-screen bg-void" />
  )

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-void">
      {/* Background layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full bg-accent-1/8 blur-[140px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent-2/8 blur-[120px]" />
        <div className="absolute top-[60%] left-[60%] w-[300px] h-[300px] rounded-full bg-accent-3/5 blur-[100px]" />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `linear-gradient(rgba(248,248,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(248,248,255,1) 1px, transparent 1px)`, backgroundSize: '80px 80px' }}
        />

        {/* Rotating rings — fixed positions, no layout shift */}
        {[0,1,2].map((i) => (
          <motion.div
            key={i}
            className="absolute border border-accent-1/[0.07] rounded-full"
            style={{
              width: `${220 + i * 110}px`,
              height: `${220 + i * 110}px`,
              top: `calc(15% + ${i * 18}%)`,
              right: `${3 + i * 4}%`,
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 25 + i * 8, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="container-custom relative z-10 text-center pt-24 pb-16">
        {/* Eyebrow */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <span className="w-8 h-px bg-accent-2" />
          <span className="font-mono text-xs text-accent-2 tracking-[0.3em] uppercase">
            NGRX Studio — Creative Agency
          </span>
          <span className="w-8 h-px bg-accent-2" />
        </motion.div>

        {/* Line 1 */}
        <motion.h1
          className="font-sora font-extrabold text-text-1 leading-[1.05] tracking-tight block"
          style={{ fontSize: 'clamp(2.8rem, 6.5vw, 6rem)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3.0, ease: [0.76, 0, 0.24, 1] }}
        >
          We Build Brands
        </motion.h1>

        {/* Line 2 — fixed height so no layout shift */}
        <motion.div
          className="mb-8 mt-1"
          style={{ height: 'clamp(3.5rem, 7.5vw, 7rem)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3.15, ease: [0.76, 0, 0.24, 1] }}
        >
          <h1
            className="font-sora font-extrabold leading-[1.05] tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 6.5vw, 6rem)' }}
          >
            <span className="text-text-3">That </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                className="text-gradient inline-block"
                initial={{ y: 60, opacity: 0, filter: 'blur(8px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: -60, opacity: 0, filter: 'blur(8px)' }}
                transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
              >
                {rotatingWords[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </h1>
        </motion.div>

        {/* Subtext */}
        <motion.p
          className="text-text-2 max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ fontSize: 'clamp(1rem, 1.4vw, 1.15rem)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 3.3, ease: [0.76, 0, 0.24, 1] }}
        >
          Video editing, motion graphics, and content strategy that turns attention into measurable, real-world growth.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 3.5, ease: [0.76, 0, 0.24, 1] }}
        >
          <a
            href="#portfolio"
            className="group relative px-8 py-4 bg-accent-1 rounded-full font-space font-semibold text-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-accent-1/30 hover:scale-[1.02]"
          >
            <span className="relative z-10">View Our Work</span>
            <span className="absolute inset-0 bg-gradient-to-r from-accent-1 to-accent-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a
            href="https://wa.me/923428283671"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-accent-2/40 font-space font-semibold text-text-1 hover:bg-accent-2/10 hover:border-accent-2 hover:scale-[1.02] transition-all duration-300"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Start a Project
          </a>
        </motion.div>

        {/* Trusted by */}
        <motion.div
          className="mt-16 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.0, duration: 0.6 }}
        >
          <p className="font-mono text-xs text-text-3 tracking-widest uppercase">Trusted by brands in</p>
          <div className="flex flex-wrap justify-center gap-4 text-text-3">
            {['🇦🇪 Dubai', '🇬🇧 London', '🇺🇸 New York', '🇨🇦 Toronto', '🇮🇳 Mumbai'].map((loc) => (
              <span key={loc} className="font-mono text-xs px-3 py-1.5 rounded-full border border-border bg-surface/40">{loc}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <AnimatePresence>
        {showScroll && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="font-mono text-[10px] text-text-3 tracking-widest uppercase">Scroll</span>
            <div className="w-5 h-8 border border-text-3/30 rounded-full flex justify-center pt-1.5">
              <motion.div
                className="w-1 h-1.5 bg-accent-2 rounded-full"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

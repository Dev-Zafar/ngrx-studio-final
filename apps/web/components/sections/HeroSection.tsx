'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const rotatingWords = ['Move People', 'Drive Growth', 'Go Viral', 'Build Empires']

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0)
  const [showScroll, setShowScroll] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % rotatingWords.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowScroll(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15, delayChildren: 2.6 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-void">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent-1/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-2/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-accent-3/5 blur-[80px]" />

        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(248,248,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(248,248,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Floating geometric shapes */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-accent-1/10 rounded-full"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              top: `${20 + i * 25}%`,
              right: `${5 + i * 5}%`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20 + i * 10, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container-custom relative z-10 text-center">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-8">
            <span className="w-8 h-px bg-accent-2" />
            <span className="font-mono text-xs text-accent-2 tracking-[0.3em] uppercase">
              NGRX Studio — Creative Agency
            </span>
            <span className="w-8 h-px bg-accent-2" />
          </motion.div>

          {/* Main headline */}
          <motion.div variants={itemVariants} className="mb-4">
            <h1
              className="font-sora font-extrabold text-text-1 leading-[1.05] tracking-tight"
              style={{ fontSize: 'clamp(3rem, 7vw, 6.5rem)' }}
            >
              We Build Brands
            </h1>
          </motion.div>

          {/* Animated second line */}
          <motion.div variants={itemVariants} className="mb-8 h-[1.1em] overflow-hidden">
            <h1
              className="font-sora font-extrabold leading-[1.05] tracking-tight"
              style={{ fontSize: 'clamp(3rem, 7vw, 6.5rem)' }}
            >
              <span className="text-text-3">That </span>
              <motion.span
                key={wordIndex}
                className="text-gradient inline-block"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
              >
                {rotatingWords[wordIndex]}
              </motion.span>
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p
            variants={itemVariants}
            className="text-text-2 max-w-xl mx-auto mb-12 leading-relaxed"
            style={{ fontSize: 'clamp(1rem, 1.5vw, 1.2rem)' }}
          >
            Video editing, motion graphics, and content strategy that turns attention into measurable growth.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#portfolio"
              className="group relative px-8 py-4 bg-accent-1 rounded-full font-space font-semibold text-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent-1/30"
            >
              <span className="relative z-10">View Our Work</span>
              <span className="absolute inset-0 bg-gradient-to-r from-accent-1 to-accent-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
            <a
              href="#contact"
              className="px-8 py-4 rounded-full border border-accent-2/40 font-space font-semibold text-text-1 hover:bg-accent-2/10 hover:border-accent-2 transition-all duration-300"
            >
              Start a Project →
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: showScroll ? 1 : 0 }}
          transition={{ delay: 3.5, duration: 0.5 }}
        >
          <span className="font-mono text-[10px] text-text-3 tracking-widest uppercase">Scroll</span>
          <motion.div
            className="w-5 h-8 border border-text-3/30 rounded-full flex justify-center pt-1.5"
          >
            <motion.div
              className="w-1 h-1.5 bg-accent-2 rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function PageLoader() {
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Skip loader if already seen in this session
    const seen = sessionStorage.getItem('ngrx-loaded')
    if (seen) {
      setLoading(false)
      return
    }

    let start = 0
    const duration = 2000
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * 100)
      setCount(start)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setTimeout(() => {
          setLoading(false)
          sessionStorage.setItem('ngrx-loaded', 'true')
          document.body.classList.remove('loading')
        }, 300)
      }
    }

    document.body.classList.add('loading')
    requestAnimationFrame(animate)
  }, [])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-void"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Logo */}
          <motion.div
            className="mb-12 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* NGRX SVG Logo */}
            <svg width="180" height="60" viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="48" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="52" fill="#F8F8FF" letterSpacing="-2">NGR</text>
              <text x="126" y="48" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="52" fill="url(#xGrad)" letterSpacing="-2">X</text>
              <defs>
                <linearGradient id="xGrad" x1="126" y1="0" x2="170" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7C3AED"/>
                  <stop offset="1" stopColor="#A855F7"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="mt-1 text-text-3 font-mono text-xs tracking-[0.4em] uppercase">Studio</div>
          </motion.div>

          {/* Counter */}
          <motion.div
            className="font-sora text-7xl font-800 text-text-3 tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-gradient font-sora font-extrabold">{count}</span>
            <span className="text-text-3 text-4xl">%</span>
          </motion.div>

          {/* Progress bar */}
          <div className="mt-8 w-48 h-[1px] bg-border overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-1 to-accent-2"
              style={{ width: `${count}%` }}
            />
          </div>

          {/* Tagline */}
          <motion.p
            className="mt-6 font-mono text-xs text-text-3 tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Frame every second
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function PageLoader() {
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (sessionStorage.getItem('ngrx-loaded')) { setLoading(false); return }

    const duration = 2000
    const startTime = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * 100))
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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'var(--color-void)' }}
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
            <svg width="180" height="56" viewBox="0 0 180 56" fill="none">
              <text x="0" y="48" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="52" fill="var(--color-text-1)" letterSpacing="-2">NGR</text>
              <text x="124" y="48" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="52" fill="url(#loaderXGrad)" letterSpacing="-2">X</text>
              <defs>
                <linearGradient id="loaderXGrad" x1="124" y1="0" x2="180" y2="56" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="mt-2 font-mono text-xs tracking-[0.4em] uppercase" style={{ color: 'var(--color-text-3)' }}>Studio</div>
          </motion.div>

          {/* Counter */}
          <motion.div
            className="font-sora font-extrabold tabular-nums"
            style={{ fontSize: 'clamp(3rem,8vw,5rem)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span style={{
              background: 'linear-gradient(135deg, var(--color-accent-1), var(--color-accent-2))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{count}</span>
            <span className="text-4xl" style={{ color: 'var(--color-text-3)' }}>%</span>
          </motion.div>

          {/* Progress bar */}
          <div className="mt-8 w-48 h-px overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <motion.div
              className="h-full"
              style={{
                width: `${count}%`,
                background: 'linear-gradient(90deg, var(--color-accent-1), var(--color-accent-2))',
              }}
            />
          </div>

          {/* Tagline */}
          <motion.p
            className="mt-6 font-mono text-xs tracking-widest uppercase"
            style={{ color: 'var(--color-text-3)' }}
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

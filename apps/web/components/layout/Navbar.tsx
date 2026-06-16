'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ThemeToggle } from '@/components/animations/ThemeToggle'
import { useTheme } from '@/components/animations/ThemeProvider'

const navLinks = [
  { label: 'Work', href: '#portfolio' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
]

const Logo = ({ id = 'nav' }: { id?: string }) => (
  <div className="flex items-center gap-2">
    <svg width="104" height="34" viewBox="0 0 104 34" fill="none">
      <text x="0" y="28" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="30" fill="var(--color-text-1)" letterSpacing="-1">NGR</text>
      <text x="74" y="28" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="30" fill={`url(#xGrad-${id})`} letterSpacing="-1">X</text>
      <defs>
        <linearGradient id={`xGrad-${id}`} x1="74" y1="0" x2="104" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
        </linearGradient>
      </defs>
    </svg>
    <span className="font-mono text-[10px] tracking-[0.3em] uppercase border-l pl-2"
      style={{ color: 'var(--color-text-3)', borderColor: 'var(--color-border)' }}>Studio</span>
  </div>
)

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled
            ? theme === 'dark'
              ? 'rgba(8,8,16,0.85)'
              : 'rgba(244,244,248,0.90)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? `1px solid var(--color-border)` : '1px solid transparent',
          transition: 'background 0.4s ease, border-color 0.4s ease',
        }}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.8, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="container-custom flex items-center justify-between py-4">
          <Link href="/"><Logo id="navbar" /></Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href}
                className="font-space text-sm transition-colors duration-200 relative group"
                style={{ color: 'var(--color-text-2)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-2)')}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                  style={{ background: 'linear-gradient(90deg, var(--color-accent-1), var(--color-accent-2))' }} />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <a href="#contact"
              className="px-5 py-2.5 rounded-full border text-sm font-space transition-all duration-300 hover:scale-[1.02]"
              style={{ borderColor: 'rgba(124,58,237,0.4)', color: 'var(--color-text-1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-accent-1)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(124,58,237,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(124,58,237,0.4)'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
            >
              Start a Project
            </a>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button className="flex flex-col gap-1.5 p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {[0,1,2].map(i => (
                <span key={i} className="block w-6 h-0.5 transition-all duration-300"
                  style={{
                    background: 'var(--color-text-1)',
                    transform: menuOpen ? (i === 0 ? 'rotate(45deg) translate(6px, 6px)' : i === 2 ? 'rotate(-45deg) translate(6px, -6px)' : '') : '',
                    opacity: menuOpen && i === 1 ? 0 : 1,
                  }} />
              ))}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8"
            style={{ background: 'var(--color-void)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navLinks.map((link, i) => (
              <motion.a key={link.label} href={link.href}
                className="font-sora text-4xl font-bold"
                style={{ color: 'var(--color-text-1)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </motion.a>
            ))}
            <motion.a href="#contact"
              className="mt-4 px-8 py-3 rounded-full text-white font-space font-semibold"
              style={{ background: 'var(--color-accent-1)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              onClick={() => setMenuOpen(false)}
            >
              Start a Project
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

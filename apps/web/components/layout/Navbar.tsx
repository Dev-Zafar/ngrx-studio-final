'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const navLinks = [
  { label: 'Work', href: '#portfolio' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass border-b border-border/40' : ''
        }`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.8, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="container-custom flex items-center justify-between py-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <svg width="110" height="36" viewBox="0 0 110 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="30" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="32" fill="#F8F8FF" letterSpacing="-1">NGR</text>
              <text x="76" y="30" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="32" fill="url(#navXGrad)" letterSpacing="-1">X</text>
              <defs>
                <linearGradient id="navXGrad" x1="76" y1="0" x2="110" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7C3AED"/>
                  <stop offset="1" stopColor="#A855F7"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="font-mono text-[10px] text-text-3 tracking-[0.3em] uppercase border-l border-border pl-2">Studio</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-space text-sm text-text-2 hover:text-text-1 transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-accent-1 to-accent-2 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#contact"
              className="px-5 py-2.5 rounded-full border border-accent-1/40 text-sm font-space text-text-1 hover:bg-accent-1/10 hover:border-accent-1 transition-all duration-300"
            >
              Start a Project
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-text-1 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-text-1 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-text-1 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-void flex flex-col items-center justify-center gap-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                className="font-sora text-4xl font-bold text-text-1 hover:text-gradient transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </motion.a>
            ))}
            <motion.a
              href="#contact"
              className="mt-4 px-8 py-3 rounded-full bg-accent-1 text-white font-space font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
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

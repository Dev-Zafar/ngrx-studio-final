'use client'
import { useEffect, useRef } from 'react'
import { motion, useInView, Variant } from 'framer-motion'

interface RevealTextProps {
  children: string
  className?: string
  delay?: number
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
}

export function RevealText({ children, className = '', delay = 0, as: Tag = 'p' }: RevealTextProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })

  const words = children.split(' ')

  return (
    <Tag ref={ref} className={`overflow-hidden ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.04,
              ease: [0.76, 0, 0.24, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function FadeIn({ children, className = '', delay = 0, direction = 'up' }: FadeInProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-5% 0px' })

  const dirMap = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
    none: {},
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...dirMap[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.76, 0, 0.24, 1] }}
    >
      {children}
    </motion.div>
  )
}

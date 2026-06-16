'use client'
import { useEffect, useRef, useState } from 'react'

export function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [isPointer, setIsPointer] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const pos = useRef({ x: -200, y: -200 })
  const outer = useRef({ x: -200, y: -200 })
  const raf = useRef<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      }
      const el = document.elementFromPoint(e.clientX, e.clientY)
      setIsPointer(!!el?.closest('a, button, [data-cursor="pointer"]'))
    }

    const tick = () => {
      outer.current.x += (pos.current.x - outer.current.x) * 0.1
      outer.current.y += (pos.current.y - outer.current.y) * 0.1
      if (outerRef.current) {
        outerRef.current.style.transform = `translate(${outer.current.x - 20}px, ${outer.current.y - 20}px)`
      }
      raf.current = requestAnimationFrame(tick)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', () => setIsHidden(true))
    document.addEventListener('mouseenter', () => setIsHidden(false))
    raf.current = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <div
        ref={outerRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] w-10 h-10 rounded-full border transition-all duration-200"
        style={{
          borderColor: isPointer ? 'var(--color-accent-1)' : 'rgba(6,182,212,0.6)',
          opacity: isHidden ? 0 : 1,
          transform: 'translate(-200px,-200px)',
          scale: isPointer ? '1.4' : '1',
          mixBlendMode: 'difference',
        }}
      />
      <div
        ref={innerRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] w-2 h-2 rounded-full"
        style={{
          background: 'var(--color-accent-1)',
          opacity: isHidden ? 0 : 1,
          transform: 'translate(-200px,-200px)',
        }}
      />
    </>
  )
}

'use client'
import { useEffect, useRef, useState } from 'react'

export function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [isPointer, setIsPointer] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const pos = useRef({ x: 0, y: 0 })
  const outerPos = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Hide on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      }
    }

    const onEnter = () => setIsHidden(false)
    const onLeave = () => setIsHidden(true)

    const checkHover = () => {
      const el = document.elementFromPoint(pos.current.x, pos.current.y)
      const isLink = el?.closest('a, button, [data-cursor="pointer"]')
      setIsPointer(!!isLink)
    }

    const animate = () => {
      outerPos.current.x += (pos.current.x - outerPos.current.x) * 0.12
      outerPos.current.y += (pos.current.y - outerPos.current.y) * 0.12
      if (outerRef.current) {
        outerRef.current.style.transform = `translate(${outerPos.current.x - 20}px, ${outerPos.current.y - 20}px)`
      }
      checkHover()
      rafRef.current = requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseenter', onEnter)
    document.addEventListener('mouseleave', onLeave)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseenter', onEnter)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      {/* Outer ring */}
      <div
        ref={outerRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] w-10 h-10 rounded-full border transition-all duration-200"
        style={{
          borderColor: isPointer ? 'rgba(124,58,237,0.8)' : 'rgba(6,182,212,0.6)',
          opacity: isHidden ? 0 : 1,
          transform: 'translate(-100px, -100px)',
          scale: isPointer ? '1.5' : '1',
          mixBlendMode: 'difference',
        }}
      />
      {/* Inner dot */}
      <div
        ref={innerRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] w-2 h-2 rounded-full bg-accent-1"
        style={{
          opacity: isHidden ? 0 : 1,
          transform: 'translate(-100px, -100px)',
        }}
      />
    </>
  )
}

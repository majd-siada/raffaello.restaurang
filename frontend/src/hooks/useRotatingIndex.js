import { useEffect, useRef, useState } from 'react'

const DEFAULT_MS = 7000

/**
 * Cycles 0..length-1 every intervalMs while the element is in view.
 * Pauses for prefers-reduced-motion.
 */
export function useRotatingIndex(length, intervalMs = DEFAULT_MS) {
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (length < 2) return undefined
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !inView) return undefined

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [length, intervalMs, inView])

  return [index, ref]
}

import { useEffect, useRef, useState } from 'react'
import { cn } from './cn'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * One-shot scroll reveal. Honors prefers-reduced-motion.
 */
export default function Reveal({ as: Tag = 'div', className, children, ...props }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(() => prefersReducedMotion())

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return undefined

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible])

  return (
    <Tag
      ref={ref}
      className={cn('public-reveal', visible && 'is-visible', className)}
      {...props}
    >
      {children}
    </Tag>
  )
}

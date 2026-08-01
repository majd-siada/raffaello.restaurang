import { useEffect, useState } from 'react'
import { useRotatingIndex } from '../hooks/useRotatingIndex'

const OVERLAY_MAIN = 'from-black/60 via-black/75 to-dark'
const OVERLAY_TOP = 'from-dark via-transparent to-black/20'
const ROTATE_MS = 4000

/**
 * Full-bleed backdrop. Pass `images` to crossfade through a gallery every 4s.
 * Falls back to a single `src` when no gallery is provided.
 * Extra slides mount after idle so LCP is not competing with gallery downloads.
 */
export default function HeroBackdrop({
  src,
  alt = '',
  images,
  objectPosition = 'center',
  loading,
  priority = false,
  srcSet,
  sizes,
}) {
  const slides =
    images?.length > 0
      ? images
      : src
        ? [{ src, alt, srcSet, sizes }]
        : []

  const [extrasReady, setExtrasReady] = useState(slides.length < 2)
  const activeSlides = extrasReady ? slides : slides.slice(0, 1)

  useEffect(() => {
    if (slides.length < 2) return undefined
    const unlock = () => setExtrasReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(unlock, { timeout: 2800 })
      return () => window.cancelIdleCallback(id)
    }
    const t = window.setTimeout(unlock, 2000)
    return () => window.clearTimeout(t)
  }, [slides.length])

  const [index, ref] = useRotatingIndex(activeSlides.length, ROTATE_MS)
  const activeAlt = activeSlides[index]?.alt || alt

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden bg-dark"
      aria-hidden={!activeAlt}
    >
      {activeSlides.map((slide, i) => {
        const isFirst = i === 0
        const visible = i === index
        return (
          <img
            key={slide.src}
            src={slide.src}
            alt={visible ? activeAlt : ''}
            srcSet={slide.srcSet}
            sizes={slide.sizes || sizes}
            className={`absolute inset-0 h-full w-full object-cover brightness-[0.85] transition-opacity duration-1000 ease-in-out ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ objectPosition }}
            decoding="async"
            fetchPriority={priority && isFirst ? 'high' : undefined}
            loading={priority && isFirst ? 'eager' : loading || 'lazy'}
          />
        )
      })}
      <div className={`absolute inset-0 bg-gradient-to-b ${OVERLAY_MAIN}`} />
      <div className={`absolute inset-0 bg-gradient-to-t ${OVERLAY_TOP}`} />
    </div>
  )
}

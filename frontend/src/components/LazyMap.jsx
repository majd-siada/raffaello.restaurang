import { useEffect, useRef, useState } from 'react'
import { SITE } from '../siteConfig'

export default function LazyMap({ className = '' }) {
  const ref = useRef(null)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || showMap) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowMap(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [showMap])

  return (
    <div ref={ref} className={`border border-white/10 overflow-hidden ${className}`}>
      {showMap ? (
        <iframe
          title={`${SITE.name} på kartan`}
          src={SITE.mapsEmbedUrl}
          width="100%"
          height="400"
          style={{ border: 0, filter: 'grayscale(0.25) brightness(0.92) contrast(1.05)' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="flex h-[400px] w-full cursor-pointer flex-col items-center justify-center gap-3 bg-dark-3 text-white/70 transition-colors hover:bg-stone hover:text-gold"
        >
          <span className="font-heading text-xl text-white">Visa karta</span>
          <span className="text-sm text-white/50">
            {SITE.addressLine1}, {SITE.addressLine2}
          </span>
        </button>
      )}
    </div>
  )
}

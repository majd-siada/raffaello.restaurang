import { useRotatingIndex } from '../hooks/useRotatingIndex'

const OVERLAY_MAIN = 'from-black/60 via-black/75 to-dark'
const OVERLAY_TOP = 'from-dark via-transparent to-black/20'
const ROTATE_MS = 7000

/**
 * Full-bleed backdrop. Pass `images` to crossfade through a gallery every 7s.
 * Falls back to a single `src` when no gallery is provided.
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

  const [index, ref] = useRotatingIndex(slides.length, ROTATE_MS)
  const activeAlt = slides[index]?.alt || alt

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden bg-dark"
      aria-hidden={!activeAlt}
    >
      {slides.map((slide, i) => {
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

import { useRotatingIndex } from '../hooks/useRotatingIndex'
import { cn } from './ui/cn'

const ROTATE_MS = 4000

/**
 * Section photo with optional gallery crossfade.
 * Clean cover crop — no doubled / offset frames.
 */
export default function SectionPhoto({
  src,
  alt = '',
  images,
  sizes = '(min-width: 768px) 50vw, 100vw',
  objectPosition,
  className,
}) {
  const slides = images?.length > 0 ? images : src ? [{ src, alt }] : []
  const [index, ref] = useRotatingIndex(slides.length, ROTATE_MS)

  const layers =
    slides.length === 0
      ? []
      : slides.length === 1
        ? [{ slide: slides[0], key: slides[0].src, visible: true }]
        : (() => {
            const prev = (index - 1 + slides.length) % slides.length
            return [
              {
                slide: slides[prev],
                key: `${slides[prev].src}-prev`,
                visible: false,
              },
              {
                slide: slides[index],
                key: `${slides[index].src}-active`,
                visible: true,
              },
            ]
          })()

  const active = layers.find((l) => l.visible)?.slide
  const activeAlt = active?.alt || alt
  const pos = objectPosition || active?.objectPosition || 'center'

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden bg-elevated shadow-[var(--shadow-card)]', className)}
      data-section-photo="clean-cover"
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-[3/4] md:aspect-auto md:h-[420px] lg:h-[450px]">
        {layers.map(({ slide, key, visible }) => (
          <img
            key={key}
            src={slide.src}
            alt={visible ? slide.alt || activeAlt : ''}
            srcSet={slide.srcSet}
            sizes={sizes}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
              visible ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            style={{
              objectPosition: visible
                ? slide.objectPosition || pos
                : slide.objectPosition || 'center',
            }}
            loading="eager"
            decoding="async"
            aria-hidden={!visible}
          />
        ))}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
        />
      </div>
    </div>
  )
}

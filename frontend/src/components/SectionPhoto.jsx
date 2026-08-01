import { useRotatingIndex } from '../hooks/useRotatingIndex'

const ROTATE_MS = 4000

/**
 * Section photo. Pass `images` to crossfade through a gallery every 4s.
 */
export default function SectionPhoto({
  src,
  alt = '',
  images,
  borderOffset = 'right',
  sizes = '(min-width: 768px) 50vw, 100vw',
}) {
  const slides = images?.length > 0 ? images : src ? [{ src, alt }] : []
  const [index, ref] = useRotatingIndex(slides.length, ROTATE_MS)
  const active = slides[index] || { src: '', alt }

  const borderClass =
    borderOffset === 'left'
      ? '-translate-x-4 translate-y-4'
      : 'translate-x-4 translate-y-4'

  return (
    <div ref={ref} className="relative">
      <div className="relative h-[450px] w-full overflow-hidden bg-dark-2">
        {slides.map((slide, i) => {
          const visible = i === index
          return (
            <img
              key={slide.src}
              src={slide.src}
              alt={visible ? active.alt || alt : ''}
              srcSet={slide.srcSet}
              sizes={slide.sizes || sizes}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
                visible ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              decoding="async"
            />
          )
        })}
      </div>
      <div className={`absolute inset-0 border border-gold/30 ${borderClass} -z-10`} />
    </div>
  )
}

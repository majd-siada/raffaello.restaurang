import { cn } from './cn'

const aspectClass = {
  square: 'aspect-square',
  portrait: 'aspect-[4/5]',
  wide: 'aspect-[16/10]',
  hero: 'aspect-[16/9] md:aspect-[21/9]',
  fill: 'absolute inset-0 h-full w-full',
}

/**
 * Unified public image treatment — no doubled frames.
 */
export default function RestaurantImage({
  src,
  srcSet,
  sizes,
  alt,
  aspect = 'portrait',
  objectPosition = 'center',
  priority = false,
  className,
  imgClassName,
  hoverScale = true,
}) {
  const isFill = aspect === 'fill'
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-elevated',
        !isFill && aspectClass[aspect],
        isFill && 'absolute inset-0',
        className,
      )}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt ?? ''}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className={cn(
          'h-full w-full object-cover transition-transform duration-500 ease-out',
          hoverScale && 'motion-safe:hover:scale-[1.03]',
          isFill ? 'absolute inset-0' : '',
          imgClassName,
        )}
        style={{ objectPosition }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-60"
      />
    </div>
  )
}

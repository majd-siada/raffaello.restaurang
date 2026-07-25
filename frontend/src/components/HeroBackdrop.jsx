const OVERLAY_MAIN = 'from-black/60 via-black/75 to-dark'
const OVERLAY_TOP = 'from-dark via-transparent to-black/20'

export default function HeroBackdrop({
  src,
  alt = '',
  objectPosition = 'center',
  loading,
  priority = false,
  srcSet,
  sizes,
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-dark" aria-hidden={!alt}>
      <img
        src={src}
        alt={alt}
        srcSet={srcSet}
        sizes={sizes}
        className="h-full w-full object-cover brightness-[0.85]"
        style={{ objectPosition }}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        loading={priority ? 'eager' : loading}
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${OVERLAY_MAIN}`} />
      <div className={`absolute inset-0 bg-gradient-to-t ${OVERLAY_TOP}`} />
    </div>
  )
}

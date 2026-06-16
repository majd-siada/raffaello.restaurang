const OVERLAY_MAIN = 'from-black/60 via-black/75 to-dark'
const OVERLAY_TOP = 'from-dark via-transparent to-black/20'

export default function HeroBackdrop({ src, alt = '', objectPosition = 'center' }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-dark" aria-hidden>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover brightness-[0.85]"
        style={{ objectPosition }}
        decoding="async"
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${OVERLAY_MAIN}`} />
      <div className={`absolute inset-0 bg-gradient-to-t ${OVERLAY_TOP}`} />
    </div>
  )
}

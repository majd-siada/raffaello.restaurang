export default function SectionPhoto({ src, alt = '', borderOffset = 'right' }) {
  const borderClass =
    borderOffset === 'left'
      ? '-translate-x-4 translate-y-4'
      : 'translate-x-4 translate-y-4'

  return (
    <div className="relative">
      <img
        src={src}
        alt={alt}
        className="h-[450px] w-full object-cover object-center"
        decoding="async"
      />
      <div className={`absolute inset-0 border border-gold/30 ${borderClass} -z-10`} />
    </div>
  )
}

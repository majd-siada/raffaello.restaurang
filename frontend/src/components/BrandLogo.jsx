import { Link } from 'react-router-dom'
import { SITE } from '../siteConfig'

export default function BrandLogo({ className = '' }) {
  return (
    <Link
      to="/"
      className={`group flex items-center gap-2.5 md:gap-3 outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm ${className}`}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden>
        {SITE.logoImage ? (
          <img
            src={SITE.logoImage}
            alt=""
            className="h-10 w-10 rounded-full object-contain bg-dark ring-2 ring-white/85 group-hover:ring-gold/90 transition-[box-shadow,ring-color]"
            decoding="async"
          />
        ) : null}
      </span>
      <span className="flex min-w-0 flex-col leading-[1.05] text-left">
        <span className="font-brand text-lg font-bold tracking-tight text-white transition-colors group-hover:text-white md:text-xl">
          {SITE.shortName}
        </span>
        <span className="font-brand-sub text-[0.7rem] italic text-white/65 md:text-[0.8rem]">
          {SITE.brandSubtitle}
        </span>
      </span>
    </Link>
  )
}

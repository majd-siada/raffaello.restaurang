import { Link } from 'react-router-dom'
import { SITE } from '../siteConfig'
import BrandLogo from './BrandLogo'
import { ButtonLink } from './ui/Button'

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.01-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.1.31.03.66-.25 1.02l-2.2 2.2z" />
  </svg>
)

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
)

const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
  </svg>
)

const EXPLORE = [
  { to: '/meny', label: 'Meny' },
  { to: '/lunch', label: 'Lunch' },
  { to: '/veckans-erbjudande', label: 'Veckans Erbjudande' },
  { to: SITE.bookingUrl, label: 'Boka bord' },
  { to: '/kontakt', label: 'Kontakt' },
  { to: '/privata-events', label: 'Events' },
  { to: '/faq', label: 'FAQ' },
  { to: '/galleri', label: 'Galleri' },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface">
      <div className="mx-auto max-w-content px-6 py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <BrandLogo className="mb-5 origin-left scale-95" />
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {SITE.tagline} — grill, pasta, pizza och bar mitt i Boden.
            </p>
            <ButtonLink to={SITE.bookingUrl} variant="primary" size="sm" className="mt-6">
              Boka bord
            </ButtonLink>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-lg text-cream">Utforska</h2>
            <ul className="space-y-3 text-sm text-white/70">
              {EXPLORE.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors hover:text-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-lg text-cream">Besök oss</h2>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <a
                  href={SITE.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 transition-colors hover:text-gold"
                >
                  <MapIcon />
                  <span>
                    {SITE.addressLine1}
                    <br />
                    {SITE.addressLine2}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${SITE.phoneTel}`}
                  className="flex items-center gap-2 transition-colors hover:text-gold"
                >
                  <PhoneIcon /> {SITE.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-center gap-2 transition-colors hover:text-gold"
                >
                  <EmailIcon /> {SITE.email}
                </a>
              </li>
              {SITE.instagramUrl?.trim() ? (
                <li>
                  <a
                    href={SITE.instagramUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-gold"
                  >
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-lg text-cream">Öppettider</h2>
            <ul className="space-y-2.5 text-sm text-white/70">
              {SITE.openingHours.map((row) => (
                <li key={row.label} className="flex justify-between gap-4">
                  <span className="text-muted">{row.label}</span>
                  <span className="tabular-nums text-cream/90">{row.hours}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-white/40">
              Köket stänger 30 minuter innan restaurangen stänger.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-6 py-6">
        <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-white/45">
            &copy; {new Date().getFullYear()} {SITE.name}. Alla rättigheter förbehållna.
          </p>
          <nav
            aria-label="Villkor"
            className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs uppercase tracking-wider text-white/45"
          >
            <Link to="/bokningsvillkor" className="transition-colors hover:text-gold">
              Bokningsvillkor
            </Link>
            <Link to="/integritet" className="transition-colors hover:text-gold">
              Integritet
            </Link>
            <Link to="/faq" className="transition-colors hover:text-gold">
              FAQ
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

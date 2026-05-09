import { Link } from 'react-router-dom'
import { SITE } from '../siteConfig'
import BrandLogo from './BrandLogo'

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.01-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.1.31.03.66-.25 1.02l-2.2 2.2z" />
  </svg>
)

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
)

const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
  </svg>
)

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
)

export default function Footer() {
  const socialLinks = [
    { name: 'Instagram', url: SITE.instagramUrl?.trim(), icon: <InstagramIcon /> },
    { name: 'TikTok', url: SITE.tiktokUrl?.trim(), icon: <TikTokIcon /> },
  ].filter(s => s.url)

  return (
    <footer className="border-t border-gold/20">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div
          className={`grid md:grid-cols-2 gap-10 ${socialLinks.length ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
        >
          {/* Kontakt Oss */}
          <div>
            <h4 className="font-heading text-lg text-white mb-4">Kontakta Oss</h4>
            <ul className="space-y-3 text-white/40 text-sm">
              <li>
                <a href={`tel:${SITE.phoneTel}`} className="hover:text-gold transition-colors flex items-center gap-2">
                  <PhoneIcon /> {SITE.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="hover:text-gold transition-colors flex items-center gap-2">
                  <EmailIcon /> {SITE.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Hitta Oss */}
          <div>
            <h4 className="font-heading text-lg text-white mb-4">Hitta Oss</h4>
            <a
              href={SITE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 text-sm leading-relaxed hover:text-gold transition-colors flex items-start gap-2"
            >
              <MapIcon />
              <span>{SITE.addressLine1}<br />{SITE.addressLine2}</span>
            </a>
          </div>

          {/* Följ Oss — visas bara om minst en social-URL är satt i siteConfig */}
          {socialLinks.length > 0 && (
            <div>
              <h4 className="font-heading text-lg text-white mb-4">Följ Oss</h4>
              <ul className="space-y-3">
                {socialLinks.map(social => (
                  <li key={social.name}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 text-sm hover:text-gold transition-colors flex items-center gap-2"
                    >
                      {social.icon} {social.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Öppettider */}
          <div>
            <h4 className="font-heading text-lg text-white mb-4">Öppettider</h4>
            <ul className="space-y-3 text-white/40 text-sm">
              {SITE.openingHours.map(row => (
                <li key={row.label} className="flex items-center gap-2">
                  <ClockIcon />
                  <span className="w-28">{row.label}</span>
                  <span>{row.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/5 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <BrandLogo className="scale-90 origin-left md:scale-100" />
          <p className="text-white/25 text-xs">
            &copy; {new Date().getFullYear()} {SITE.name}. Alla rättigheter förbehållna.
          </p>
        </div>
      </div>
    </footer>
  )
}

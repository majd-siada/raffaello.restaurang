import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SITE } from '../siteConfig'
import BrandLogo from './BrandLogo'

const navLinksLeft = [
  { to: '/', label: 'Hem' },
  { to: '/meny', label: 'Meny' },
  { to: '/om-oss', label: 'Om oss' },
]

const navLinksRight = [
  { to: '/kontakt', label: 'Kontakt' },
  { to: '/privata-events', label: 'Events' },
]

function DesktopNavLink({ to, label }) {
  const location = useLocation()
  const active =
    to === '/' ? location.pathname === '/' : location.pathname === to

  return (
    <Link
      to={to}
      className={`text-xs uppercase tracking-widest transition-colors ${
        active ? 'text-gold' : 'text-white/80 hover:text-gold'
      }`}
    >
      {label}
    </Link>
  )
}

function MobileMenuButton({ menuOpen, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex flex-col justify-center gap-1.5 p-2 -mr-2 min-h-[44px] min-w-[44px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      aria-expanded={menuOpen}
      aria-controls="mobile-nav-overlay"
      aria-label={menuOpen ? 'Stäng meny' : 'Öppna meny'}
    >
      <span
        className={`block w-6 h-0.5 bg-gold transition-transform duration-300 origin-center ${
          menuOpen ? 'translate-y-2 rotate-45' : ''
        }`}
      />
      <span
        className={`block w-6 h-0.5 bg-gold transition-opacity duration-300 ${
          menuOpen ? 'opacity-0' : ''
        }`}
      />
      <span
        className={`block w-6 h-0.5 bg-gold transition-transform duration-300 origin-center ${
          menuOpen ? '-translate-y-2 -rotate-45' : ''
        }`}
      />
    </button>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)
  const toggleMenu = () => setMenuOpen(o => !o)

  return (
    <nav
      className={`fixed top-0 left-0 right-0 transition-all duration-300 lg:z-50 ${
        menuOpen ? 'z-[200]' : 'z-50'
      } ${
        scrolled && !menuOpen
          ? 'bg-dark/95 backdrop-blur-sm shadow-lg'
          : !menuOpen
            ? 'bg-transparent'
            : ''
      }`}
    >
      {/* Mobile: top bar when menu is closed */}
      <div
        className={`lg:hidden max-w-7xl mx-auto px-6 py-4 flex items-center justify-between ${
          menuOpen ? 'hidden' : 'relative'
        }`}
      >
        <BrandLogo />
        <MobileMenuButton menuOpen={false} onToggle={() => setMenuOpen(true)} />
      </div>

      {/* Mobile: full-screen menu — solid background so hero never bleeds through */}
      {menuOpen && (
        <div
          id="mobile-nav-overlay"
          className="lg:hidden fixed inset-0 z-[200] flex min-h-[100dvh] flex-col bg-dark"
          role="dialog"
          aria-modal="true"
          aria-label="Meny"
        >
          <div
            className="flex shrink-0 items-center justify-between border-b border-white/10 bg-dark px-6 py-4"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <BrandLogo />
            <MobileMenuButton menuOpen onToggle={toggleMenu} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-8 py-10">
            {[...navLinksLeft, ...navLinksRight].map(link => {
              const active =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={`font-heading text-2xl tracking-wide transition-colors sm:text-3xl ${
                    active ? 'text-gold' : 'text-white hover:text-gold'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <a
              href={SITE.bookingUrl}
              onClick={closeMenu}
              className="mt-2 border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-dark"
            >
              Boka bord
            </a>
          </div>
        </div>
      )}

      {/* Desktop: split around centered logo */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="flex justify-end items-center gap-8 pr-4">
            {navLinksLeft.map(link => (
              <DesktopNavLink key={link.to} {...link} />
            ))}
          </div>
          <div className="flex shrink-0 justify-center">
            <BrandLogo className="justify-center" />
          </div>
          <div className="flex justify-start items-center gap-8 pl-4">
            {navLinksRight.map(link => (
              <DesktopNavLink key={link.to} {...link} />
            ))}
            <a
              href={SITE.bookingUrl}
              className="ml-2 shrink-0 border border-gold px-5 py-2 text-xs uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Boka bord
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

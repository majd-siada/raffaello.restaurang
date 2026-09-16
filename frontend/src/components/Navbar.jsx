import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SITE } from '../siteConfig'
import BrandLogo from './BrandLogo'
import { ButtonLink } from './ui/Button'
import { NAV_LINKS_LEFT, NAV_LINKS_RIGHT } from '../navConfig'

function DesktopNavLink({ to, href, label, external }) {
  const location = useLocation()
  const active =
    !external && (to === '/' ? location.pathname === '/' : location.pathname === to)
  const className = `relative text-xs uppercase tracking-[0.18em] transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:text-gold hover:after:scale-x-100 ${
    active ? 'text-gold after:scale-x-100' : 'text-white/75'
  }`

  if (external && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    )
  }

  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  )
}

function MobileMenuButton({ menuOpen, onToggle, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onToggle}
      className="flex min-h-[44px] min-w-[44px] -mr-2 flex-col justify-center gap-1.5 rounded-sm p-2 outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      aria-expanded={menuOpen}
      aria-controls="mobile-nav-overlay"
      aria-label={menuOpen ? 'Stäng meny' : 'Öppna meny'}
    >
      <span
        className={`block h-0.5 w-6 origin-center bg-gold transition-transform duration-300 ${
          menuOpen ? 'translate-y-2 rotate-45' : ''
        }`}
      />
      <span
        className={`block h-0.5 w-6 bg-gold transition-opacity duration-300 ${
          menuOpen ? 'opacity-0' : ''
        }`}
      />
      <span
        className={`block h-0.5 w-6 origin-center bg-gold transition-transform duration-300 ${
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
  const locationKey = `${location.pathname}${location.search}`
  const [menuLocationKey, setMenuLocationKey] = useState(locationKey)
  const closeButtonRef = useRef(null)
  const openButtonRef = useRef(null)
  const overlayRef = useRef(null)
  const wasOpenRef = useRef(false)

  if (menuLocationKey !== locationKey) {
    setMenuLocationKey(locationKey)
    setMenuOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      wasOpenRef.current = true
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      closeButtonRef.current?.focus?.()

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          setMenuOpen(false)
          return
        }
        if (e.key !== 'Tab' || !overlayRef.current) return
        const focusable = overlayRef.current.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
      window.addEventListener('keydown', onKeyDown)
      return () => {
        document.body.style.overflow = prev
        window.removeEventListener('keydown', onKeyDown)
      }
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false
      openButtonRef.current?.focus?.()
    }
    return undefined
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)
  const toggleMenu = () => setMenuOpen((o) => !o)

  return (
    <nav
      className={`fixed top-0 right-0 left-0 transition-all duration-300 lg:z-50 ${
        menuOpen ? 'z-[200]' : 'z-50'
      } ${
        scrolled && !menuOpen
          ? 'border-b border-white/5 bg-bg/90 shadow-lg backdrop-blur-md'
          : !menuOpen
            ? 'bg-transparent'
            : ''
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-6 sm:py-4 lg:hidden ${
          menuOpen ? 'hidden' : 'relative'
        }`}
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <BrandLogo />
        <MobileMenuButton
          menuOpen={false}
          onToggle={() => setMenuOpen(true)}
          buttonRef={openButtonRef}
        />
      </div>

      {menuOpen && (
        <div
          ref={overlayRef}
          id="mobile-nav-overlay"
          className="fixed inset-0 z-[200] flex min-h-[100dvh] flex-col bg-bg lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Meny"
        >
          <div
            className="flex shrink-0 items-center justify-between border-b border-white/10 bg-bg px-6 py-4"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <BrandLogo />
            <MobileMenuButton menuOpen onToggle={toggleMenu} buttonRef={closeButtonRef} />
          </div>
          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-8 py-10"
            style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
          >
            {[...NAV_LINKS_LEFT, ...NAV_LINKS_RIGHT].map((link) => {
              const key = link.href || link.to
              const active =
                !link.external &&
                (link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname === link.to)
              const className = `min-h-[44px] font-heading text-2xl tracking-wide transition-colors sm:text-3xl ${
                active ? 'text-gold' : 'text-cream hover:text-gold'
              }`

              if (link.external && link.href) {
                return (
                  <a
                    key={key}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className={className}
                  >
                    {link.label}
                  </a>
                )
              }

              return (
                <Link key={key} to={link.to} onClick={closeMenu} className={className}>
                  {link.label}
                </Link>
              )
            })}
            <ButtonLink
              to={SITE.bookingUrl}
              variant="primary"
              className="mt-4"
              onClick={closeMenu}
            >
              Boka bord
            </ButtonLink>
          </div>
        </div>
      )}

      <div className="mx-auto hidden max-w-7xl px-6 py-4 lg:block">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="flex items-center justify-end gap-8 pr-4">
            {NAV_LINKS_LEFT.map((link) => (
              <DesktopNavLink key={link.href || link.to} {...link} />
            ))}
          </div>
          <div className="flex shrink-0 justify-center">
            <BrandLogo className="justify-center" />
          </div>
          <div className="flex items-center justify-start gap-8 pl-4">
            {NAV_LINKS_RIGHT.map((link) => (
              <DesktopNavLink key={link.href || link.to} {...link} />
            ))}
            <ButtonLink to={SITE.bookingUrl} variant="primary" size="sm" className="ml-2 shrink-0">
              Boka bord
            </ButtonLink>
          </div>
        </div>
      </div>
    </nav>
  )
}

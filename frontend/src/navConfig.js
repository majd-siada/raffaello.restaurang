/**
 * Stable business navigation / CTA structure.
 *
 * Empty CMS content must NOT hide these destinations — pages own empty states.
 * Homepage gallery may use SITE.gallery when CMS is empty (V6).
 */

export const NAV_LINKS_LEFT = [
  { to: '/', label: 'Hem' },
  { to: '/meny', label: 'Meny' },
  { to: '/veckans-erbjudande', label: 'Erbjudande' },
  { to: '/lunch', label: 'Lunch' },
  { to: '/om-oss', label: 'Om oss' },
]

export const NAV_LINKS_RIGHT = [
  { to: '/kontakt', label: 'Kontakt' },
  { to: '/privata-events', label: 'Events' },
]

/** Homepage hero — four business actions (order is product requirement). */
export const HERO_BUSINESS_CTAS = [
  { to: '/meny', label: 'Meny', variant: 'outline' },
  { to: '/veckans-erbjudande', label: 'Veckans Erbjudande', variant: 'outline' },
  { to: '/lunch', label: 'Lunch', variant: 'outline' },
  { to: '/boka', label: 'Boka bord', variant: 'solid' },
]

/** Labels that must remain visible regardless of lunch/offer API emptiness. */
export const ALWAYS_VISIBLE_BUSINESS_LABELS = [
  'Meny',
  'Erbjudande',
  'Lunch',
  'Boka bord',
]

/**
 * P1 Homepage IA section order.
 * Bar omitted (CLIENT CONFIRMATION). Reviews omitted at render when CMS empty.
 * Gallery uses CMS or SITE.gallery fallback.
 */
export const HOME_SECTION_ORDER = [
  'atmosphere',
  'signatures',
  'why',
  'lunch-offer',
  'events',
  'reviews',
  'gallery',
  'location',
  'booking-close',
]

export function leftNavIncludesLunch(links = NAV_LINKS_LEFT) {
  return links.some((l) => l.to === '/lunch' && l.label === 'Lunch')
}

export function leftNavIncludesWeeklyOffer(links = NAV_LINKS_LEFT) {
  return links.some(
    (l) => l.to === '/veckans-erbjudande' && l.label === 'Erbjudande',
  )
}

export function heroCtaLabels(ctas = HERO_BUSINESS_CTAS) {
  return ctas.map((c) => c.label)
}

/**
 * Empty lunch/offer payloads must not remove business nav destinations.
 * Gallery empty CMS → homepage may still show SITE photos (separate concern).
 */
export function shouldShowNavLinkForEmptyContent(path, contentEmpty) {
  if (path === '/lunch' || path === '/veckans-erbjudande') {
    return true
  }
  if (path === '/galleri' || path === 'gallery') {
    return !contentEmpty
  }
  return true
}

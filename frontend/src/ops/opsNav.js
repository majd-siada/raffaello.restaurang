/**
 * Ops sidebar / mobile nav — Swedish labels, permission keys from /auth/me/.
 */

export const OPS_NAV_ITEMS = [
  { to: '/ops', label: 'Översikt', end: true },
  { to: '/ops/meny', label: 'Meny', perm: 'menu' },
  { to: '/ops/lunch', label: 'Lunch', perm: 'lunch' },
  { to: '/ops/erbjudande', label: 'Veckans Erbjudande', perm: 'offers' },
  { to: '/ops/bokningar', label: 'Bokningar', perm: 'bookings' },
  { to: '/ops/event', label: 'Privata Event', perm: 'events' },
  { to: '/ops/galleri', label: 'Galleri', perm: 'gallery' },
  { to: '/ops/recensioner', label: 'Recensioner', perm: 'reviews' },
  { to: '/ops/restaurang', label: 'Restaurang' },
  { to: '/ops/faq-legal', label: 'FAQ / Legal' },
  { to: '/ops/system', label: 'System' },
]

/** All protected ops route prefixes (for tests / guards). */
export const OPS_ROUTE_PATHS = [
  '/ops',
  '/ops/login',
  '/ops/meny',
  '/ops/lunch',
  '/ops/erbjudande',
  '/ops/bokningar',
  '/ops/event',
  '/ops/galleri',
  '/ops/recensioner',
  '/ops/restaurang',
  '/ops/faq-legal',
  '/ops/system',
]

export function filterNavByPermissions(permissions = {}) {
  return OPS_NAV_ITEMS.filter((item) => {
    if (!item.perm) return true
    return Boolean(permissions[item.perm])
  })
}

export function opsPathsIncludeRoot() {
  return OPS_ROUTE_PATHS.every((p) => p.startsWith('/ops'))
}

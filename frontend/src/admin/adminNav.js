/**
 * Admin navigation — grouped IA for AdminShell.
 * `ready: false` → honest “Kommer senare” placeholder (no fake CMS).
 */

export const ADMIN_OVERVIEW_ITEM = {
  to: '/admin',
  label: 'Översikt',
  end: true,
  ready: true,
}

/** Four operational groups — labels match restaurant staff vocabulary. */
export const ADMIN_NAV_GROUPS = [
  {
    id: 'innehall',
    label: 'Innehåll',
    items: [
      { to: '/admin/meny', label: 'Meny', ready: true },
      { to: '/admin/lunch', label: 'Lunch', ready: true },
      { to: '/admin/erbjudande', label: 'Veckans Erbjudande', ready: true },
      { to: '/admin/galleri', label: 'Galleri', ready: true },
      { to: '/admin/recensioner', label: 'Recensioner', ready: true },
      { to: '/admin/faq', label: 'FAQ', ready: true },
      { to: '/admin/legal', label: 'Legal', ready: true },
    ],
  },
  {
    id: 'bokning',
    label: 'Bokning',
    items: [
      { to: '/admin/bokningar', label: 'Bokningar', ready: true },
      { to: '/admin/event', label: 'Privata Event', ready: true },
    ],
  },
  {
    id: 'restaurang',
    label: 'Restaurang',
    items: [
      { to: '/admin/oppettider', label: 'Öppettider', ready: true },
      { to: '/admin/restaurang', label: 'Restaurang', ready: true },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [{ to: '/admin/system', label: 'System', ready: true }],
  },
]

/** Flat list for tests / helpers — Overview first, then groups in order. */
export const ADMIN_NAV_ITEMS = [
  ADMIN_OVERVIEW_ITEM,
  ...ADMIN_NAV_GROUPS.flatMap((g) => g.items),
]

export const ADMIN_ROUTE_PATHS = [
  '/admin',
  '/admin/login',
  ...ADMIN_NAV_ITEMS.filter((i) => i.to !== '/admin').map((i) => i.to),
]

export function adminPathsUnderAdmin() {
  return ADMIN_ROUTE_PATHS.every((p) => p.startsWith('/admin'))
}

/**
 * Resolve active nav item for a pathname (nested routes use longest prefix).
 */
export function getAdminNavItem(pathname) {
  const path = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname

  if (path === '/admin') return ADMIN_OVERVIEW_ITEM

  const candidates = ADMIN_NAV_ITEMS.filter((item) => {
    if (item.end) return false
    return path === item.to || path.startsWith(`${item.to}/`)
  })
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.to.length - a.to.length)
  return candidates[0]
}

export function getAdminNavGroupId(pathname) {
  const item = getAdminNavItem(pathname)
  if (!item || item.end) return null
  const group = ADMIN_NAV_GROUPS.find((g) => g.items.some((i) => i.to === item.to))
  return group?.id ?? null
}

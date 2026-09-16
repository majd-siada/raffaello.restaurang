import { useLocation, NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from './AuthContext'
import {
  ADMIN_NAV_GROUPS,
  ADMIN_OVERVIEW_ITEM,
  getAdminNavItem,
} from './adminNav'
import { btnSecondary } from './format'
import { LoadingState } from './ui'
import './admin.css'

function isItemActive(pathname, item) {
  const active = getAdminNavItem(pathname)
  if (!active) return false
  if (item.end) return pathname === '/admin' || pathname === '/admin/'
  return active.to === item.to
}

function NavItemLink({ item, pathname }) {
  const active = isItemActive(pathname, item)
  return (
    <NavLink
      to={item.to}
      end={item.end}
      aria-current={active ? 'page' : undefined}
      className={[
        'whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors md:px-4',
        'min-h-11 inline-flex items-center',
        active
          ? 'border-gold text-cream'
          : 'border-transparent text-muted hover:text-cream',
      ].join(' ')}
    >
      {item.label}
    </NavLink>
  )
}

function AdminNavGroups({ pathname }) {
  return (
    <>
      <div className="flex shrink-0 flex-col gap-1" role="group" aria-labelledby="admin-nav-group-oversikt">
        <span
          id="admin-nav-group-oversikt"
          className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80 md:px-4"
        >
          Översikt
        </span>
        <div className="flex gap-0.5">
          <NavItemLink item={ADMIN_OVERVIEW_ITEM} pathname={pathname} />
        </div>
      </div>

      {ADMIN_NAV_GROUPS.map((group) => {
        const headingId = `admin-nav-group-${group.id}`
        return (
          <div
            key={group.id}
            className="flex shrink-0 flex-col gap-1"
            role="group"
            aria-labelledby={headingId}
          >
            <span
              id={headingId}
              className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80 md:px-4"
            >
              {group.label}
            </span>
            <div className="flex gap-0.5">
              {group.items.map((item) => (
                <NavItemLink key={item.to} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}

export default function AdminShell() {
  const { authenticated, loading, username, logout } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-app min-h-screen bg-bg">
        <LoadingState label="Kontrollerar session…" />
      </div>
    )
  }
  if (!authenticated) return <Navigate to="/admin/login" replace />

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-app min-h-screen bg-bg text-cream/85">
      <a href="#admin-main" className="skip-link">
        Hoppa till innehåll
      </a>

      <header className="border-b border-cream/10 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/raffaello-logo-80.webp"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
            />
            <span className="truncate font-heading text-lg text-cream">Raffaello Admin</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {username ? (
              <span className="hidden max-w-[10rem] truncate text-sm text-muted sm:inline">
                {username}
              </span>
            ) : null}
            <button type="button" className={btnSecondary()} onClick={handleLogout}>
              Logga ut
            </button>
          </div>
        </div>

        <nav
          className="mx-auto flex max-w-7xl items-end gap-3 overflow-x-auto px-3 pb-px md:gap-5 md:px-6"
          aria-label="Admin-navigering"
        >
          <AdminNavGroups pathname={location.pathname} />
        </nav>
      </header>

      <main id="admin-main" className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}

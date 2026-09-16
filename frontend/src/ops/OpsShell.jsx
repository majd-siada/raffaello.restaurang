import { useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { filterNavByPermissions } from './opsNav'
import { btnSecondary } from './opsFormat'
import { LoadingState } from './ui'

function navLinkClass({ isActive }) {
  return [
    'block min-h-11 rounded px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-gold-dim text-gold'
      : 'text-white/70 hover:bg-white/5 hover:text-white',
  ].join(' ')
}

export default function OpsShell() {
  const { authenticated, loading, permissions, username, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const items = filterNavByPermissions(permissions)

  useEffect(() => {
    if (!mobileOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  if (loading) return <LoadingState label="Kontrollerar session…" />
  if (!authenticated) return <Navigate to="/ops/login" replace />

  async function handleLogout() {
    await logout()
    navigate('/ops/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-dark text-white/80">
      <a href="#ops-main" className="skip-link">
        Hoppa till innehåll
      </a>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-dark-2 px-4 py-3 lg:hidden">
        <button
          type="button"
          className="min-h-11 min-w-11 rounded border border-white/15 px-3 text-sm text-gold"
          aria-expanded={mobileOpen}
          aria-controls="ops-mobile-nav"
          onClick={() => setMobileOpen((v) => !v)}
        >
          Meny
        </button>
        <span className="font-heading text-lg text-gold">Raffaello Ops</span>
        <button type="button" className={btnSecondary()} onClick={handleLogout}>
          Logga ut
        </button>
      </div>

      {mobileOpen ? (
        <nav
          id="ops-mobile-nav"
          className="border-b border-white/10 bg-dark-2 px-3 py-2 lg:hidden"
          aria-label="Ops-navigering"
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}

      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-dark-2 px-3 py-6 lg:flex">
          <div className="mb-6 px-2">
            <p className="font-heading text-xl text-gold">Raffaello Ops</p>
            <p className="mt-1 truncate text-xs text-white/45">{username}</p>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Ops-navigering">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className={`${btnSecondary()} mt-4 w-full`} onClick={handleLogout}>
            Logga ut
          </button>
        </aside>

        <main id="ops-main" className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

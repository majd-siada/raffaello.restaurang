/**
 * When the SPA accidentally receives /django-admin (should be proxied to Django).
 * React Admin owns /admin; classic Django Admin is /django-admin/.
 */
import { useLayoutEffect } from 'react'

export default function DjangoAdminRedirect() {
  useLayoutEffect(() => {
    const path = window.location.pathname + window.location.search + window.location.hash
    // Prefer same-origin /django-admin/ (Vite proxy / nginx → Django).
    if (!path.startsWith('/django-admin')) {
      window.location.replace(`/django-admin/${path.replace(/^\/+/, '')}`)
      return
    }
    // If we landed here inside SPA, force full navigation so proxy can catch it.
    window.location.replace(path)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark p-8 text-center text-gold">
      <p>Öppnar Django Admin…</p>
    </div>
  )
}

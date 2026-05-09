import { useLayoutEffect } from 'react'

/**
 * When /admin is handled by the SPA (Vite HTML fallback), send the browser to Django.
 * Same origin as vite.config.js proxy target so admin + /static/ assets load reliably.
 */
export default function AdminRedirect() {
  useLayoutEffect(() => {
    const env = import.meta.env.VITE_API_URL?.trim()
    const origin =
      env ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol}//127.0.0.1:8000`
        : 'http://127.0.0.1:8000')
    const base = origin.replace(/\/$/, '')
    const path = window.location.pathname + window.location.search + window.location.hash
    window.location.replace(`${base}${path}`)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0908] text-[#d4b078] flex items-center justify-center p-8 text-center">
      <p>Öppnar adminpanelen…</p>
    </div>
  )
}

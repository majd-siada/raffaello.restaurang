import { useEffect } from 'react'

function dismissBootShell() {
  const boot = document.getElementById('boot')
  if (!boot) return
  boot.classList.add('is-done')
  // Remove promptly so boot brand text cannot stack under React hero.
  window.setTimeout(() => boot.remove(), 80)
}

/** Call from a painted route so the fixed boot shell fades after real content is ready. */
export default function BootDismiss() {
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(dismissBootShell)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return null
}

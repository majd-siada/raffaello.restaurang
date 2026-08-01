import { useEffect } from 'react'

function dismissBootShell() {
  const boot = document.getElementById('boot')
  if (!boot) return
  boot.classList.add('is-done')
  window.setTimeout(() => boot.remove(), 160)
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

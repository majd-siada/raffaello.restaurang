import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      const scrollToTarget = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
          return true
        }
        return false
      }

      if (!scrollToTarget()) {
        const timer = window.setTimeout(scrollToTarget, 100)
        return () => window.clearTimeout(timer)
      }
      return
    }

    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

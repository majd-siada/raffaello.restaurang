import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)

/**
 * Mobile: skip webfonts (system fallbacks already match metrics) — big LCP/TBT win.
 * Desktop: load brand fonts after first paint.
 */
const loadFonts = () => {
  const mobile =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px), (hover: none) and (max-width: 1024px)').matches
  if (mobile) return
  import('./fonts.js')
}
if ('requestIdleCallback' in window) {
  requestIdleCallback(loadFonts, { timeout: 4000 })
} else {
  setTimeout(loadFonts, 1200)
}

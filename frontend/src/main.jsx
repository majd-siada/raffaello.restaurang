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

/* Defer webfonts until after first paint (FCP) */
const loadFonts = () => {
  import('./fonts.js')
}
if ('requestIdleCallback' in window) {
  requestIdleCallback(loadFonts, { timeout: 1800 })
} else {
  setTimeout(loadFonts, 1)
}

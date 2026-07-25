import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-500.css'
import '@fontsource/playfair-display/latin-600.css'
import '@fontsource/playfair-display/latin-700.css'
import '@fontsource/playfair-display/latin-400-italic.css'
import '@fontsource/playfair-display/latin-500-italic.css'
import '@fontsource/playfair-display/latin-600-italic.css'
import '@fontsource/playfair-display/latin-ext-400.css'
import '@fontsource/playfair-display/latin-ext-500.css'
import '@fontsource/playfair-display/latin-ext-600.css'
import '@fontsource/playfair-display/latin-ext-700.css'
import '@fontsource/playfair-display/latin-ext-400-italic.css'
import '@fontsource/playfair-display/latin-ext-500-italic.css'
import '@fontsource/playfair-display/latin-ext-600-italic.css'
import '@fontsource/poppins/latin-300.css'
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-500.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-ext-300.css'
import '@fontsource/poppins/latin-ext-400.css'
import '@fontsource/poppins/latin-ext-500.css'
import '@fontsource/poppins/latin-ext-600.css'
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import '@fontsource/outfit/latin-700.css'
import '@fontsource/outfit/latin-ext-500.css'
import '@fontsource/outfit/latin-ext-600.css'
import '@fontsource/outfit/latin-ext-700.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/latin-500-italic.css'
import '@fontsource/cormorant-garamond/latin-600-italic.css'
import '@fontsource/cormorant-garamond/latin-ext-500.css'
import '@fontsource/cormorant-garamond/latin-ext-600.css'
import '@fontsource/cormorant-garamond/latin-ext-500-italic.css'
import '@fontsource/cormorant-garamond/latin-ext-600-italic.css'

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

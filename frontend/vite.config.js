import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev: browser calls /api/* on :5173 → forward to Django on :8000 (same as `npm run dev` backend).
    // changeOrigin: false keeps the browser Host (e.g. localhost:5173) so Django
    // redirects and ALLOWED_HOSTS match dev; true would send 127.0.0.1:8000 and break both.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
      // Django admin + its static assets (otherwise /admin on :5173 hits the SPA).
      '/admin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
})

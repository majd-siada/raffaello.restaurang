import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminRedirect from './components/AdminRedirect'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Menu = lazy(() => import('./pages/Menu'))
const Contact = lazy(() => import('./pages/Contact'))
const PrivateEvents = lazy(() => import('./pages/PrivateEvents'))

function PageFallback() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center"
      aria-busy="true"
    >
      <p className="text-sm uppercase tracking-widest text-white/50">Laddar…</p>
    </div>
  )
}

function dismissBootShell() {
  const boot = document.getElementById('boot')
  if (!boot) return
  boot.classList.add('is-done')
  window.setTimeout(() => boot.remove(), 160)
}

export default function App() {
  useEffect(() => {
    // Wait one frame so React content is painted under the fixed shell
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(dismissBootShell)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="min-h-screen bg-dark text-white/80">
      <ScrollToTop />
      <Navbar />
      <main>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/admin" element={<AdminRedirect />} />
            <Route path="/admin/*" element={<AdminRedirect />} />
            <Route path="/" element={<Home />} />
            <Route path="/meny" element={<Menu />} />
            <Route path="/om-oss" element={<About />} />
            <Route path="/kontakt" element={<Contact />} />
            <Route path="/privata-events" element={<PrivateEvents />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

import { lazy, Suspense } from 'react'
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
    <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
      <p className="text-white/50 text-sm uppercase tracking-widest">Laddar…</p>
    </div>
  )
}

export default function App() {
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

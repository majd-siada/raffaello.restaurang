import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminRedirect from './components/AdminRedirect'
import BootDismiss from './components/BootDismiss'
import Home from './pages/Home'

const About = lazy(() => import('./pages/About'))
const Menu = lazy(() => import('./pages/Menu'))
const WeeklyOffer = lazy(() => import('./pages/WeeklyOffer'))
const Lunch = lazy(() => import('./pages/Lunch'))
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

function withBoot(Page) {
  return function RouteWithBoot() {
    return (
      <>
        <BootDismiss />
        <Page />
      </>
    )
  }
}

const MenuPage = withBoot(Menu)
const WeeklyOfferPage = withBoot(WeeklyOffer)
const LunchPage = withBoot(Lunch)
const AboutPage = withBoot(About)
const ContactPage = withBoot(Contact)
const PrivateEventsPage = withBoot(PrivateEvents)
const HomePage = withBoot(Home)
const AdminPage = withBoot(AdminRedirect)

export default function App() {
  return (
    <div className="min-h-screen bg-dark text-white/80">
      <ScrollToTop />
      <Navbar />
      <main>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/meny" element={<MenuPage />} />
            <Route path="/veckans-erbjudande" element={<WeeklyOfferPage />} />
            <Route path="/lunch" element={<LunchPage />} />
            <Route path="/om-oss" element={<AboutPage />} />
            <Route path="/kontakt" element={<ContactPage />} />
            <Route path="/privata-events" element={<PrivateEventsPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

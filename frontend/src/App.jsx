import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import BootDismiss from './components/BootDismiss'
import Home from './pages/Home'
import OpsApp from './ops/OpsApp'
import AdminApp from './admin/AdminApp'

const Footer = lazy(() => import('./components/Footer'))
const About = lazy(() => import('./pages/About'))
const Menu = lazy(() => import('./pages/Menu'))
const WeeklyOffer = lazy(() => import('./pages/WeeklyOffer'))
const Lunch = lazy(() => import('./pages/Lunch'))
const Contact = lazy(() => import('./pages/Contact'))
const Boka = lazy(() => import('./pages/Boka'))
const PrivateEvents = lazy(() => import('./pages/PrivateEvents'))
const Faq = lazy(() => import('./pages/Faq'))
const Gallery = lazy(() => import('./pages/Gallery'))
const BookingTerms = lazy(() => import('./pages/BookingTerms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const NotFound = lazy(() => import('./pages/NotFound'))

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
const BokaPage = withBoot(Boka)
const PrivateEventsPage = withBoot(PrivateEvents)
const FaqPage = withBoot(Faq)
const GalleryPage = withBoot(Gallery)
const BookingTermsPage = withBoot(BookingTerms)
const PrivacyPage = withBoot(Privacy)
const NotFoundPage = withBoot(NotFound)
const HomePage = withBoot(Home)

function PublicSite() {
  return (
    <div className="public-site min-h-screen bg-bg text-white/80">
      <a href="#main-content" className="skip-link">
        Hoppa till innehåll
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="main-content">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/meny" element={<MenuPage />} />
            <Route path="/veckans-erbjudande" element={<WeeklyOfferPage />} />
            <Route path="/lunch" element={<LunchPage />} />
            <Route path="/om-oss" element={<AboutPage />} />
            <Route path="/boka" element={<BokaPage />} />
            <Route path="/kontakt" element={<ContactPage />} />
            <Route path="/privata-events" element={<PrivateEventsPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/galleri" element={<GalleryPage />} />
            <Route path="/bokningsvillkor" element={<BookingTermsPage />} />
            <Route path="/integritet" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  // React Admin owns /admin (SPA). Classic Django Admin is at /django-admin.
  if (pathname.startsWith('/admin')) {
    return <AdminApp />
  }
  // Legacy Ops — compatibility surface (same handlers as /api/admin via /api/ops).
  if (pathname.startsWith('/ops')) {
    return <OpsApp />
  }
  return <PublicSite />
}

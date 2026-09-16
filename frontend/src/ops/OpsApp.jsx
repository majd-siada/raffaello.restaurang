import { Routes, Route, Navigate } from 'react-router-dom'
import BootDismiss from '../components/BootDismiss'
import { AuthProvider } from './AuthContext'
import OpsShell from './OpsShell'
import LoginPage from './LoginPage'
import OverviewPage from './OverviewPage'
import MenuPage from './MenuPage'
import LunchPage from './LunchPage'
import OffersPage from './OffersPage'
import BookingsPage from './BookingsPage'
import EventsPage from './EventsPage'
import GalleryPage from './GalleryPage'
import ReviewsPage from './ReviewsPage'
import RestaurantPage from './RestaurantPage'
import FaqLegalPage from './FaqLegalPage'
import SystemPage from './SystemPage'

export default function OpsApp() {
  return (
    <AuthProvider>
      <BootDismiss />
      <Routes>
        <Route path="/ops/login" element={<LoginPage />} />
        <Route path="/ops" element={<OpsShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="meny" element={<MenuPage />} />
          <Route path="lunch" element={<LunchPage />} />
          <Route path="erbjudande" element={<OffersPage />} />
          <Route path="bokningar" element={<BookingsPage />} />
          <Route path="bokningar/:id" element={<BookingsPage />} />
          <Route path="event" element={<EventsPage />} />
          <Route path="event/:id" element={<EventsPage />} />
          <Route path="galleri" element={<GalleryPage />} />
          <Route path="recensioner" element={<ReviewsPage />} />
          <Route path="restaurang" element={<RestaurantPage />} />
          <Route path="faq-legal" element={<FaqLegalPage />} />
          <Route path="system" element={<SystemPage />} />
          <Route path="*" element={<Navigate to="/ops" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/ops" replace />} />
      </Routes>
    </AuthProvider>
  )
}

import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import BootDismiss from '../components/BootDismiss'
import { AdminAuthProvider } from './AuthContext'
import AdminShell from './AdminShell'
import AdminLoginPage from './LoginPage'
import AdminOverviewPage from './OverviewPage'
import AdminMenuPage from './MenuPage'
import AdminLunchPage from './LunchPage'
import AdminOffersPage from './OffersPage'
import AdminOpeningHoursPage from './OpeningHoursPage'
import AdminBookingsPage from './BookingsPage'
import AdminEventsPage from './EventsPage'
import AdminGalleryPage from './GalleryPage'
import AdminReviewsPage from './ReviewsPage'
import AdminFaqPage from './FaqPage'
import AdminLegalPage from './LegalPage'
import AdminSystemPage from './SystemPage'
import AdminRestaurantPage from './RestaurantPage'

/** Alias for user-facing /admin/privata-events → established /admin/event */
function PrivataEventsIdRedirect() {
  const { id } = useParams()
  return <Navigate to={`/admin/event/${id}`} replace />
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <BootDismiss />
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="meny" element={<AdminMenuPage />} />
          <Route path="menu" element={<Navigate to="/admin/meny" replace />} />
          <Route path="lunch" element={<AdminLunchPage />} />
          <Route path="erbjudande" element={<AdminOffersPage />} />
          <Route path="bokningar" element={<AdminBookingsPage />} />
          <Route path="bokningar/:id" element={<AdminBookingsPage />} />
          <Route path="event" element={<AdminEventsPage />} />
          <Route path="event/:id" element={<AdminEventsPage />} />
          <Route
            path="privata-events"
            element={<Navigate to="/admin/event" replace />}
          />
          <Route
            path="privata-events/:id"
            element={<PrivataEventsIdRedirect />}
          />
          <Route path="galleri" element={<AdminGalleryPage />} />
          <Route path="recensioner" element={<AdminReviewsPage />} />
          <Route path="oppettider" element={<AdminOpeningHoursPage />} />
          <Route path="restaurang" element={<AdminRestaurantPage />} />
          <Route path="faq" element={<AdminFaqPage />} />
          <Route path="legal" element={<AdminLegalPage />} />
          <Route path="system" element={<AdminSystemPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminAuthProvider>
  )
}

import { Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Menu from './pages/Menu'
import Contact from './pages/Contact'
import PrivateEvents from './pages/PrivateEvents'
import AdminRedirect from './components/AdminRedirect'

export default function App() {
  return (
    <div className="min-h-screen bg-dark text-white/80">
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/admin" element={<AdminRedirect />} />
          <Route path="/admin/*" element={<AdminRedirect />} />
          <Route path="/" element={<Home />} />
          <Route path="/meny" element={<Menu />} />
          <Route path="/om-oss" element={<About />} />
          <Route path="/kontakt" element={<Contact />} />
          <Route path="/privata-events" element={<PrivateEvents />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

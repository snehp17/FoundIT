import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SelectUniversity from './pages/SelectUniversity'
import Dashboard from './pages/Dashboard'
import ReportLost from './pages/ReportLost'
import ReportFound from './pages/ReportFound'
import ItemsListing from './pages/ItemsListing'
import ItemDetail from './pages/ItemDetail'
import SmartMatch from './pages/SmartMatch'
import ClaimVerification from './pages/ClaimVerification'
import SecureChat from './pages/SecureChat'
import RecoveryTracking from './pages/RecoveryTracking'
import Notifications from './pages/Notifications'
import UserProfile from './pages/UserProfile'
import AdminDashboard from './pages/AdminDashboard'
import ModeratorDashboard from './pages/ModeratorDashboard'
import AnalyticsDashboard from './pages/AnalyticsDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/select-university" element={<SelectUniversity />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report-lost" element={<ReportLost />} />
        <Route path="/report-found" element={<ReportFound />} />
        <Route path="/items" element={<ItemsListing />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/matches" element={<SmartMatch />} />
        <Route path="/verify/:id" element={<ClaimVerification />} />
        <Route path="/chat" element={<SecureChat />} />
        <Route path="/tracking/:id" element={<RecoveryTracking />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/moderator" element={<ModeratorDashboard />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

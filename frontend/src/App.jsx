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
import PartnerUniversity from './pages/PartnerUniversity'
import UniAdminDashboard from './pages/UniAdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/select-university" element={<SelectUniversity />} />
        <Route path="/partner" element={<PartnerUniversity />} />

        {/* Protected Routes - Students Only */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/report-lost" element={<ProtectedRoute allowedRoles={['student']}><ReportLost /></ProtectedRoute>} />
        <Route path="/report-found" element={<ProtectedRoute allowedRoles={['student']}><ReportFound /></ProtectedRoute>} />
        <Route path="/items" element={<ProtectedRoute allowedRoles={['student', 'university_admin', 'super_admin']}><ItemsListing /></ProtectedRoute>} />
        <Route path="/items/:id" element={<ProtectedRoute allowedRoles={['student', 'university_admin', 'super_admin']}><ItemDetail /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute allowedRoles={['student']}><SmartMatch /></ProtectedRoute>} />
        <Route path="/verify/:id" element={<ProtectedRoute allowedRoles={['student', 'university_admin']}><ClaimVerification /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute allowedRoles={['student']}><SecureChat /></ProtectedRoute>} />
        <Route path="/tracking/:id" element={<ProtectedRoute allowedRoles={['student']}><RecoveryTracking /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute allowedRoles={['student', 'university_admin', 'super_admin']}><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['student', 'university_admin', 'super_admin']}><UserProfile /></ProtectedRoute>} />

        {/* Protected Routes - Super Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['super_admin']}><AdminDashboard /></ProtectedRoute>} />

        {/* Protected Routes - University Admin */}
        <Route path="/uni-admin" element={<ProtectedRoute allowedRoles={['university_admin']}><UniAdminDashboard /></ProtectedRoute>} />

        {/* Keeping old routes accessible just in case but ideally should be cleaned up */}
        <Route path="/moderator" element={<ProtectedRoute allowedRoles={['university_admin', 'super_admin']}><ModeratorDashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={['university_admin', 'super_admin']}><AnalyticsDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

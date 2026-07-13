import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { Bell, Search, User, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api'

export default function AppLayout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  useEffect(() => {
    // Optionally fetch unread notifications count
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications')
        const unread = res.data.filter(n => !n.is_read).length
        setUnreadCount(unread)
      } catch (err) {
        // ignore for now
      }
    }
    if (user) {
      fetchUnread()
    }
  }, [user])

  const initial = user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'
  const isSuperAdmin = user?.role === 'super_admin'

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content */}
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 min-h-screen"
      >
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-secondary-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-secondary-900">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-secondary-50 border border-secondary-100 rounded-xl px-4 py-2 w-64">
              <Search className="w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search items..."
                className="bg-transparent text-sm text-secondary-600 placeholder:text-secondary-400 outline-none flex-1"
              />
            </div>

            {/* Notifications */}
            <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-secondary-100 transition-colors">
              <Bell className="w-5 h-5 text-secondary-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-secondary-100 transition-colors">
                <div className={`w-8 h-8 rounded-full ${isSuperAdmin ? 'bg-gradient-to-br from-purple-600 to-purple-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'} flex items-center justify-center text-white text-sm font-bold`}>
                  {initial}
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl border border-secondary-100 shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-secondary-100">
                    <p className="text-sm font-medium text-secondary-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-secondary-500 truncate">{user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'university_admin' ? 'University Admin' : 'Student'}</p>
                  </div>
                  <Link onClick={() => setDropdownOpen(false)} to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors">
                    <User className="w-4 h-4" /> My Profile
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors text-left">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </motion.main>
    </div>
  )
}

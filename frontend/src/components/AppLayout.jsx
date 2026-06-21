import { useState } from 'react'
import Sidebar from './Sidebar'
import { Bell, Search, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AppLayout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false)

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
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            </Link>

            {/* Profile */}
            <Link to="/profile" className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-secondary-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-sm font-bold">
                S
              </div>
            </Link>
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

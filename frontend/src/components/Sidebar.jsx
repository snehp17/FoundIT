import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Search, PlusCircle, PackageSearch, MessageSquare,
  Bell, Settings, User, LogOut, ChevronLeft, ChevronRight,
  MapPin, BarChart2, Shield, Compass, TrendingUp
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Search, label: 'Browse Items', path: '/items' },
  { icon: PlusCircle, label: 'Report Lost', path: '/report-lost' },
  { icon: PackageSearch, label: 'Report Found', path: '/report-found' },
  { icon: TrendingUp, label: 'Smart Matches', path: '/matches' },
  { icon: MessageSquare, label: 'Secure Chat', path: '/chat' },
  { icon: MapPin, label: 'Tracking', path: '/tracking/1' },
  { icon: Bell, label: 'Notifications', path: '/notifications', badge: 3 },
]

const adminItems = [
  { icon: BarChart2, label: 'Analytics', path: '/analytics' },
  { icon: Shield, label: 'Moderator', path: '/moderator' },
  { icon: Settings, label: 'Admin', path: '/admin' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full z-40"
    >
      <div className="w-full h-full bg-secondary-900 text-white flex flex-col shadow-2xl overflow-hidden relative">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <span className="font-display font-bold text-white">
            {collapsed ? <>F<span className="text-primary-400">I</span></> : <>Found<span className="text-primary-400">IT</span></>}
          </span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
        <div className={`text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3 px-1 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && 'Main'}
        </div>
        {navItems.map(({ icon: Icon, label, path, badge }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                active
                  ? 'bg-primary text-white shadow-md'
                  : 'text-secondary-400 hover:text-white hover:bg-surface/10'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
              {badge && !collapsed && (
                <span className="ml-auto text-xs bg-error text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {badge}
                </span>
              )}
              {badge && collapsed && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
              )}
            </Link>
          )
        })}

        <div className={`text-xs font-semibold text-secondary-500 uppercase tracking-wider mt-5 mb-3 px-1 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && 'Admin'}
        </div>
        {adminItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-primary text-white shadow-md'
                  : 'text-secondary-400 hover:text-white hover:bg-surface/10'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className={`border-t border-white/10 p-3 ${collapsed ? '' : ''}`}>
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface/10 cursor-pointer transition-all ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            S
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Student User</p>
              <p className="text-xs text-secondary-400 truncate">student@university.edu</p>
            </div>
          )}
          {!collapsed && <LogOut className="w-4 h-4 text-secondary-400 flex-shrink-0" />}
        </div>
      </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-surface border border-secondary-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all text-secondary-600 hover:text-primary z-50"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </motion.aside>
  )
}

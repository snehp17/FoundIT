import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import {
  Package, Clock, TrendingUp, Brain, Plus, Search,
  ArrowRight, CheckCircle2, AlertCircle, Eye, MapPin,
  Bell, BarChart2, ChevronRight
} from 'lucide-react'
import api from '../api'

// Removing hardcoded recentItems
// const recentItems = [...]



export default function Dashboard() {
  const [recentItems, setRecentItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [dynamicStats, setDynamicStats] = useState({ active: 0, matches: 0, pending: 0, recovered: 0 })

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications')
        setNotifications(res.data.slice(0, 4))
      } catch (err) {
        console.error('Error fetching notifications:', err)
      }
    }
    fetchNotifications()
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [itemsRes, matchesRes, myReportsRes] = await Promise.all([
          api.get('/items'),
          api.get('/matches'),
          api.get('/items/user/my-reports')
        ])

        const allItems = itemsRes.data || []
        const allMatches = matchesRes.data || []
        const myReports = myReportsRes.data || []

        // Active reports = user's items that are not Closed
        const activeReports = myReports.filter(i => i.status !== 'Closed').length
        // AI matches = pending matches
        const aiMatches = allMatches.filter(m => m.status === 'pending').length
        // Pending claims = matches accepted but recovery not closed
        const pendingClaims = allMatches.filter(m => m.status === 'accepted' && m.recovery?.status !== 'CLOSED').length
        // Recovered = user's closed items
        const recovered = myReports.filter(i => i.status === 'Closed').length

        setDynamicStats({ active: activeReports, matches: aiMatches, pending: pendingClaims, recovered })

        // Recent items = only non-closed
        const sorted = allItems.filter(i => i.status !== 'Closed').sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
        setRecentItems(sorted)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoadingItems(false)
      }
    }
    fetchDashboardData()
  }, [])

  const stats = [
    { icon: Package, label: 'Active Reports', value: String(dynamicStats.active), change: 'Your open reports', color: 'text-primary', bg: 'bg-primary/10', trend: 'up' },
    { icon: Brain, label: 'AI Matches', value: String(dynamicStats.matches), change: 'Pending review', color: 'text-purple-600', bg: 'bg-purple-100', trend: 'up' },
    { icon: Clock, label: 'In Recovery', value: String(dynamicStats.pending), change: 'Awaiting handover', color: 'text-warning', bg: 'bg-warning/10', trend: 'neutral' },
    { icon: CheckCircle2, label: 'Items Recovered', value: String(dynamicStats.recovered), change: 'Successfully returned', color: 'text-accent', bg: 'bg-accent/10', trend: 'up' },
  ]

  return (
    <AppLayout title="Campus Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-secondary-900 rounded-3xl p-6 md:p-8 overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-10 left-1/2 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-1">
                Good morning, {JSON.parse(localStorage.getItem('user'))?.name?.split(' ')[0] || 'Student'}! 👋
              </h2>
              <p className="text-secondary-400">
                {JSON.parse(localStorage.getItem('user'))?.university || 'Campus'} · 2 items awaiting your action
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/report-lost" className="btn-primary btn-sm">
                <Plus className="w-4 h-4" />
                Report Lost
              </Link>
              <Link to="/report-found" className="btn-sm inline-flex items-center gap-2 bg-surface/10 text-white border border-white/20 rounded-xl px-4 py-2 hover:bg-surface/20 transition-all">
                <Plus className="w-4 h-4" />
                Report Found
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-sm font-medium text-secondary-900">{stat.label}</div>
              <div className="text-xs text-secondary-400 mt-0.5">{stat.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Items */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900">Recent Reports</h3>
                <Link to="/items" className="text-sm text-primary hover:text-primary-700 flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-secondary-100">
                {loadingItems ? (
                  <div className="px-6 py-8 text-center text-secondary-500">Loading recent reports...</div>
                ) : recentItems.length === 0 ? (
                  <div className="px-6 py-8 text-center text-secondary-500">No recent reports found.</div>
                ) : recentItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-secondary-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.type === 'LOST' ? 'bg-error/10 text-error' : 'bg-accent/10 text-green-700'}`}>
                      {item.type === 'LOST' ? '✕' : '✓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-secondary-900 text-sm">{item.title}</span>
                        <span className={`badge text-xs ${item.type === 'LOST' ? 'badge-error' : 'badge-success'}`}>{item.type}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-secondary-400 mt-0.5">
                        <span>{item.category}</span>
                        <span>·</span>
                        <MapPin className="w-3 h-3" />
                        <span>{item.location}</span>
                        <span>·</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status && <span className={`badge text-xs badge-secondary`}>{item.status}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar widgets */}
          <div className="space-y-4">
            {/* Notifications */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
              <div className="px-5 py-4 border-b border-secondary-100 flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900 text-sm">Recent Alerts</h3>
                <Link to="/notifications" className="text-xs text-primary">See all</Link>
              </div>
              <div className="divide-y divide-secondary-100">
                {notifications.length === 0 ? (
                  <div className="px-5 py-4 text-center text-sm text-secondary-500">No recent alerts.</div>
                ) : notifications.map((notif, i) => {
                  let Icon = Bell;
                  let color = 'text-warning bg-warning/10';
                  if (notif.type === 'match') {
                     Icon = Brain;
                     color = 'text-primary bg-primary/10';
                  } else if (notif.type === 'recovery' || notif.type === 'verify') {
                     Icon = CheckCircle2;
                     color = 'text-accent bg-accent/10';
                  }

                  const timeStr = new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={notif.id || i} className="flex items-start gap-3 px-5 py-3.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-secondary-700 leading-relaxed font-medium">{notif.title}</p>
                        <p className="text-xs text-secondary-500 truncate">{notif.message}</p>
                        <span className="text-[10px] text-secondary-400 mt-1 block">{timeStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 text-sm mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Package, label: 'Report Lost', path: '/report-lost', color: 'hover:bg-error/5 hover:border-error/20 hover:text-error' },
                  { icon: Search, label: 'Browse Found', path: '/items?type=found', color: 'hover:bg-accent/5 hover:border-accent/20 hover:text-green-700' },
                  { icon: Brain, label: 'View Matches', path: '/matches', color: 'hover:bg-primary/5 hover:border-primary/20 hover:text-primary' },
                  { icon: BarChart2, label: 'Analytics', path: '/analytics', color: 'hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    to={action.path}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-secondary-100 text-secondary-600 transition-all duration-200 ${action.color} cursor-pointer`}
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recovery rate */}
            <div className="bg-primary/5 rounded-3xl border border-primary/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">Campus Recovery Rate</span>
              </div>
              <div className="text-4xl font-bold text-secondary-900 mb-1">78%</div>
              <div className="text-xs text-secondary-400 mb-3">↑ 5% from last month</div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: '78%' }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import {
  Package, Users, CheckCircle2, TrendingUp, AlertTriangle,
  BarChart2, MapPin, Clock, ChevronRight, Shield, Eye, Trash2
} from 'lucide-react'

const kpis = [
  { label: 'Active Reports', value: '347', change: '+18 today', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Registered Users', value: '4,821', change: '+124 this month', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
  { label: 'Recovery Rate', value: '78%', change: '↑ 5% this week', icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
  { label: 'Pending Verification', value: '23', change: '12 urgent', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
]

const recentReports = [
  { id: 1, user: 'S2847', item: 'MacBook Pro 14"', category: 'Electronics', location: 'Main Library', time: '2h ago', status: 'Matching', statusColor: 'badge-warning' },
  { id: 2, user: 'S1209', item: 'Blue Hydroflask', category: 'Personal', location: 'Cafeteria', time: '4h ago', status: 'Verified', statusColor: 'badge-success' },
  { id: 3, user: 'S3481', item: 'Student ID Card', category: 'Documents', location: 'Bus Stop', time: '1d ago', status: 'Pending', statusColor: 'badge-primary' },
  { id: 4, user: 'S9021', item: 'AirPods Pro', category: 'Electronics', location: 'Lecture Hall', time: '6h ago', status: 'Claimed', statusColor: 'badge-secondary' },
  { id: 5, user: 'S5632', item: 'Prescription Glasses', category: 'Accessories', location: 'Sports Complex', time: '2d ago', status: 'Active', statusColor: 'badge-secondary' },
]

const hotspots = [
  { location: 'Main Library', count: 89, pct: 78 },
  { location: 'Cafeteria', count: 67, pct: 58 },
  { location: 'Sports Complex', count: 45, pct: 39 },
  { location: 'Bus Stop', count: 32, pct: 28 },
  { location: 'Computer Lab', count: 21, pct: 18 },
]

export default function AdminDashboard() {
  return (
    <AppLayout title="Admin Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <span className="text-xs text-accent font-medium">{kpi.change}</span>
              </div>
              <div className={`text-3xl font-bold ${kpi.color} mb-1`}>{kpi.value}</div>
              <div className="text-sm text-secondary-500">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Reports Table */}
          <div className="lg:col-span-2 bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900">Recent Reports</h3>
              <Link to="/items" className="text-sm text-primary hover:text-primary-700 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['User', 'Item', 'Category', 'Location', 'Time', 'Status', 'Actions'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map(r => (
                    <tr key={r.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="table-cell font-medium">#{r.user}</td>
                      <td className="table-cell">{r.item}</td>
                      <td className="table-cell text-secondary-400">{r.category}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3 text-secondary-400" />
                          {r.location}
                        </div>
                      </td>
                      <td className="table-cell text-secondary-400 text-xs">{r.time}</td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${r.statusColor}`}>{r.status}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-primary/10 text-secondary-400 hover:text-primary transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-error/10 text-secondary-400 hover:text-error transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar widgets */}
          <div className="space-y-4">
            {/* Recovery Chart */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 mb-4 text-sm">7-Day Recovery Trend</h3>
              <div className="flex items-end gap-2 h-20">
                {[45, 62, 58, 71, 80, 76, 89].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                    className="flex-1 rounded-t-lg bg-gradient-to-br from-blue-600 to-blue-800"
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i} className="text-xs text-secondary-400 flex-1 text-center">{d}</span>
                ))}
              </div>
            </div>

            {/* Hotspots */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 mb-4 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-error" />
                Loss Hotspots
              </h3>
              <div className="space-y-3">
                {hotspots.map((spot, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-secondary-600">{spot.location}</span>
                      <span className="font-semibold text-secondary-900">{spot.count}</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${spot.pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="progress-fill"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 mb-4 text-sm">Admin Actions</h3>
              <div className="space-y-2">
                {[
                  { icon: Shield, label: 'Review Verifications', path: '/moderator', count: 23 },
                  { icon: BarChart2, label: 'View Analytics', path: '/analytics', count: null },
                  { icon: Users, label: 'Manage Users', path: '#', count: null },
                ].map(action => (
                  <Link
                    key={action.label}
                    to={action.path}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <action.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-secondary-900">{action.label}</span>
                    {action.count && <span className="badge-error text-xs">{action.count}</span>}
                    <ChevronRight className="w-4 h-4 text-secondary-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { BarChart2, TrendingUp, Download, Calendar, MapPin, Package, Users, CheckCircle2 } from 'lucide-react'

const periods = ['7 Days', '30 Days', '90 Days', '1 Year']

const weeklyData = [45, 62, 58, 71, 80, 76, 89]
const monthlyData = [38, 52, 61, 55, 70, 65, 72, 80, 76, 83, 78, 89]

const categories = [
  { label: 'Electronics', count: 128, pct: 37, color: 'bg-primary' },
  { label: 'Documents', count: 89, pct: 26, color: 'bg-violet-500' },
  { label: 'Accessories', count: 67, pct: 19, color: 'bg-accent' },
  { label: 'Bags', count: 48, pct: 14, color: 'bg-warning' },
  { label: 'Other', count: 15, pct: 4, color: 'bg-error' },
]

const topLocations = [
  { location: 'Main Library', reports: 89, recovered: 71, rate: 80 },
  { location: 'Cafeteria', reports: 67, recovered: 48, rate: 72 },
  { location: 'Sports Complex', reports: 45, recovered: 29, rate: 64 },
  { location: 'Bus Stop', reports: 32, recovered: 18, rate: 56 },
  { location: 'Computer Lab', reports: 21, recovered: 15, rate: 71 },
]

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('7 Days')
  const data = period === '7 Days' ? weeklyData : monthlyData
  const labels = period === '7 Days'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <AppLayout title="Analytics Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-secondary-900">Campus Analytics</h2>
            <p className="text-secondary-500 text-sm">IIT Delhi · Academic Year 2024–25</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-secondary-100 rounded-xl p-1 gap-0.5">
              {periods.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-surface text-secondary-900 shadow-sm' : 'text-secondary-500'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="btn-secondary btn-sm gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Package, label: 'Total Reports', value: '347', change: '↑ 12%', color: 'text-primary', bg: 'bg-primary/10' },
            { icon: CheckCircle2, label: 'Recovered', value: '271', change: '↑ 8%', color: 'text-accent', bg: 'bg-accent/10' },
            { icon: TrendingUp, label: 'Recovery Rate', value: '78%', change: '↑ 5%', color: 'text-violet-600', bg: 'bg-violet-100' },
            { icon: Users, label: 'Active Users', value: '4,821', change: '↑ 18%', color: 'text-warning', bg: 'bg-warning/10' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <span className="text-xs font-semibold text-accent">{kpi.change}</span>
              </div>
              <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-sm text-secondary-500 mt-1">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recovery Trend */}
          <div className="lg:col-span-2 bg-surface rounded-3xl border border-secondary-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-secondary-900">Recovery Rate Trend</h3>
                <p className="text-xs text-secondary-400 mt-0.5">% of reports resolved per {period === '7 Days' ? 'day' : 'month'}</p>
              </div>
              <BarChart2 className="w-5 h-5 text-secondary-400" />
            </div>
            <div className="flex items-end gap-2 h-32">
              {data.map((val, i) => (
                <motion.div
                  key={`${period}-${i}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="flex-1 rounded-t-xl cursor-pointer hover:opacity-80 transition-opacity group relative"
                  style={{ background: 'linear-gradient(to top, #2563EB, #7C3AED)' }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-secondary-900 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {val}%
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between mt-3">
              {labels.map(l => (
                <span key={l} className="text-xs text-secondary-400 flex-1 text-center">{l}</span>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-surface rounded-3xl border border-secondary-100 shadow-card p-6">
            <h3 className="font-semibold text-secondary-900 mb-5">Category Breakdown</h3>
            {/* Donut-like */}
            <div className="relative w-32 h-32 mx-auto mb-5">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let offset = 0
                  const colors = ['#2563EB', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444']
                  return categories.map((cat, i) => {
                    const stroke = cat.pct
                    const el = (
                      <motion.circle
                        key={i}
                        cx="50" cy="50" r="35"
                        fill="none"
                        stroke={colors[i]}
                        strokeWidth="18"
                        strokeDasharray="220"
                        strokeDashoffset={`${220 - (220 * cat.pct / 100)}`}
                        style={{ transformOrigin: 'center', transform: `rotate(${offset * 3.6}deg)` }}
                        initial={{ strokeDashoffset: 220 }}
                        animate={{ strokeDashoffset: 220 - (220 * cat.pct / 100) }}
                        transition={{ duration: 0.8, delay: i * 0.15 }}
                      />
                    )
                    offset += cat.pct
                    return el
                  })
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-secondary-900">347</span>
                <span className="text-xs text-secondary-400">Total</span>
              </div>
            </div>
            <div className="space-y-2">
              {categories.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${cat.color} flex-shrink-0`} />
                  <span className="text-xs text-secondary-600 flex-1">{cat.label}</span>
                  <span className="text-xs font-semibold text-secondary-900">{cat.count}</span>
                  <span className="text-xs text-secondary-400">{cat.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Locations Table */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-error" />
            <h3 className="font-semibold text-secondary-900">Top Loss Locations</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                {['Location', 'Total Reports', 'Recovered', 'Recovery Rate', 'Performance'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topLocations.map((loc, i) => (
                <tr key={i} className="hover:bg-secondary-50 transition-colors">
                  <td className="table-cell font-medium">{loc.location}</td>
                  <td className="table-cell">{loc.reports}</td>
                  <td className="table-cell text-accent font-medium">{loc.recovered}</td>
                  <td className="table-cell">
                    <span className={`badge text-xs ${loc.rate >= 75 ? 'badge-success' : loc.rate >= 60 ? 'badge-warning' : 'badge-error'}`}>
                      {loc.rate}%
                    </span>
                  </td>
                  <td className="table-cell w-32">
                    <div className="progress-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${loc.rate}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="progress-fill"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
